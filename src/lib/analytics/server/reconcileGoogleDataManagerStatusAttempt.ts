import type {
  GoogleDataManagerStatusClaim,
  GoogleDataManagerStatusOutcome
} from './googleDataManagerStatusTypes'
import { retrieveGoogleDataManagerRequestStatus } from './retrieveGoogleDataManagerRequestStatus'
import { computeGoogleDataManagerStatusDelayMs } from './googleDataManagerStatusPollingPolicy'

type Dependencies = {
  now: () => number
  random: () => number
  retrieveStatus: typeof retrieveGoogleDataManagerRequestStatus
}

const defaultDependencies: Dependencies = {
  now: Date.now,
  random: Math.random,
  retrieveStatus: retrieveGoogleDataManagerRequestStatus
}

function summarizeError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error)

  return message.slice(0, 1_000)
}

function nextCheckAt(
  claim: GoogleDataManagerStatusClaim,
  checkedAt: number,
  random: () => number
) {
  const delayMs = computeGoogleDataManagerStatusDelayMs(
    claim.statusCheckAttempts,
    random
  )

  return new Date(checkedAt + delayMs).toISOString()
}

export async function reconcileGoogleDataManagerStatusAttempt(
  claim: GoogleDataManagerStatusClaim,
  dependencies: Dependencies = defaultDependencies
): Promise<GoogleDataManagerStatusOutcome> {
  const startedAt = dependencies.now()

  try {
    const result = await dependencies.retrieveStatus(
      claim.requestId
    )
    const finishedAt = dependencies.now()
    const latencyMs = Math.max(0, finishedAt - startedAt)

    switch (result.overallStatus) {
      case 'SUCCESS':
        if (
          result.recordCount !== 1 ||
          result.errorCounts.length > 0
        ) {
          return {
            claim,
            latencyMs,
            result,
            status: 'processing_failure'
          }
        }
        if (result.warningCounts.length > 0) {
          return {
            claim,
            latencyMs,
            result,
            status: 'succeeded_with_warnings'
          }
        }
        return { claim, latencyMs, result, status: 'succeeded' }
      case 'FAILED':
        return { claim, latencyMs, result, status: 'failed' }
      case 'PARTIAL_SUCCESS':
        return {
          claim,
          latencyMs,
          result,
          status: 'partial_success'
        }
      case 'PROCESSING':
        return {
          claim,
          latencyMs,
          nextCheckAt: nextCheckAt(
            claim,
            finishedAt,
            dependencies.random
          ),
          result,
          status: 'processing'
        }
      default:
        return {
          claim,
          latencyMs,
          nextCheckAt: nextCheckAt(
            claim,
            finishedAt,
            dependencies.random
          ),
          result,
          status: 'unknown'
        }
    }
  } catch (error) {
    const finishedAt = dependencies.now()

    return {
      claim,
      errorMessage: summarizeError(error),
      latencyMs: Math.max(0, finishedAt - startedAt),
      nextCheckAt: nextCheckAt(
        claim,
        finishedAt,
        dependencies.random
      ),
      status: 'retry'
    }
  }
}
