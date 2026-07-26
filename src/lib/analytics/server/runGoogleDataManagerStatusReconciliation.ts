import { createPostgresGoogleDataManagerStatusStore } from './postgresGoogleDataManagerStatusStore'
import { reconcileGoogleDataManagerStatusAttempt } from './reconcileGoogleDataManagerStatusAttempt'
import type {
  GoogleDataManagerStatusClaim,
  GoogleDataManagerStatusOutcome,
  GoogleDataManagerStatusStore
} from './googleDataManagerStatusTypes'

const MAX_BATCH_SIZE = 100
const STATUS_CHECK_CONCURRENCY = 5

export type GoogleDataManagerStatusBatchSummary = {
  claimed: number
  deadLettered: number
  limitReached: boolean
  processing: number
  retried: number
  succeeded: number
  succeededWithWarnings: number
  timedOut: number
  unknown: number
}

type Dependencies = {
  reconcileAttempt: (
    claim: GoogleDataManagerStatusClaim
  ) => Promise<GoogleDataManagerStatusOutcome>
  store: GoogleDataManagerStatusStore
}

const defaultDependencies: Dependencies = {
  reconcileAttempt: reconcileGoogleDataManagerStatusAttempt,
  store: createPostgresGoogleDataManagerStatusStore()
}

function validateBatchSize(maxItems: number) {
  if (
    !Number.isInteger(maxItems) ||
    maxItems < 1 ||
    maxItems > MAX_BATCH_SIZE
  ) {
    throw new Error(
      `Google Data Manager status maxItems must be between 1 and ${MAX_BATCH_SIZE}`
    )
  }
}

function countOutcome(
  summary: GoogleDataManagerStatusBatchSummary,
  outcome: GoogleDataManagerStatusOutcome
) {
  switch (outcome.status) {
    case 'succeeded':
      summary.succeeded += 1
      break
    case 'succeeded_with_warnings':
      summary.succeededWithWarnings += 1
      break
    case 'processing':
      summary.processing += 1
      break
    case 'failed':
    case 'partial_success':
    case 'processing_failure':
      summary.deadLettered += 1
      break
    case 'retry':
      summary.retried += 1
      break
    case 'unknown':
      summary.unknown += 1
      break
  }
}

export async function runGoogleDataManagerStatusReconciliation(
  input: { maxItems: number },
  dependencies: Dependencies = defaultDependencies
): Promise<GoogleDataManagerStatusBatchSummary> {
  validateBatchSize(input.maxItems)

  const timedOut = await dependencies.store.expireStale()

  const claims: GoogleDataManagerStatusClaim[] = []

  while (claims.length < input.maxItems) {
    const claim = await dependencies.store.claimNext()
    if (!claim) break
    claims.push(claim)
  }

  const summary: GoogleDataManagerStatusBatchSummary = {
    claimed: claims.length,
    deadLettered: 0,
    limitReached: claims.length === input.maxItems,
    processing: 0,
    retried: 0,
    succeeded: 0,
    succeededWithWarnings: 0,
    timedOut,
    unknown: 0
  }

  for (
    let offset = 0;
    offset < claims.length;
    offset += STATUS_CHECK_CONCURRENCY
  ) {
    const chunk = claims.slice(
      offset,
      offset + STATUS_CHECK_CONCURRENCY
    )
    const outcomes = await Promise.all(
      chunk.map(claim => dependencies.reconcileAttempt(claim))
    )

    await Promise.all(
      outcomes.map(outcome =>
        dependencies.store.complete(outcome)
      )
    )
    outcomes.forEach(outcome => countOutcome(summary, outcome))
  }

  return summary
}
