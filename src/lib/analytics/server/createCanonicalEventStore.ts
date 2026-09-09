import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import type {
  CanonicalEventAcceptance,
  CanonicalEventLookup,
  CanonicalEventStore,
  CanonicalStoredEvent,
  CreatedProviderDispatchAttempt
} from './canonicalEventStore'
import {
  mapCanonicalEventSourceEvidencePersistence,
  type CanonicalEventSourceEvidenceInsert
} from './canonicalEventSourceEvidence'
import {
  mapCanonicalEventPersistence,
  type CanonicalLedgerInsert,
  type ProviderDispatchInsert
} from './mapCanonicalEventPersistence'
import { canReleasePageViewMarketing } from './canReleasePageViewMarketing'

export type CanonicalEventTransaction = {
  findLedger?: (
    identity: CanonicalEventLookup
  ) => Promise<CanonicalStoredEvent | null>
  insertDispatch: (
    row: ProviderDispatchInsert
  ) => Promise<string | null>
  insertLedger: (row: CanonicalLedgerInsert) => Promise<boolean>
  upsertSourceEvidence: (
    row: CanonicalEventSourceEvidenceInsert
  ) => Promise<void>
}

export type CanonicalEventTransactionRunner = (
  work: (
    transaction: CanonicalEventTransaction
  ) => Promise<CanonicalEventAcceptance>
) => Promise<CanonicalEventAcceptance>

export function createCanonicalEventStore(
  runTransaction: CanonicalEventTransactionRunner
): CanonicalEventStore {
  return {
    accept: input =>
      startAnalyticsSpan(
        {
          name: 'db.transaction canonical_event.accept',
          op: 'db.transaction',
          attributes: {
            'db.system': 'postgresql',
            'db.operation.name': 'accept',
            'db.namespace': 'marketing'
          }
        },
        () =>
          runTransaction(async transaction => {
            const rows = mapCanonicalEventPersistence(input)
            const sourceEvidence =
              input.sourceEvidence === undefined ?
                undefined
              : mapCanonicalEventSourceEvidencePersistence({
                  event: input.event,
                  sourceEvidence: input.sourceEvidence
                })
            const inserted = await transaction.insertLedger(
              rows.ledger
            )

            if (sourceEvidence) {
              await transaction.upsertSourceEvidence(
                sourceEvidence
              )
            }

            let dispatches = rows.dispatches
            if (!inserted) {
              const stored =
                (
                  input.allowPageViewMarketingRelease &&
                  input.event.event_name === 'page_view' &&
                  input.event.consent.marketing === 'granted' &&
                  transaction.findLedger
                ) ?
                  await transaction.findLedger(input.event)
                : null

              if (
                !canReleasePageViewMarketing(stored, input.event)
              ) {
                return {
                  createdDispatchAttempts: [],
                  status: 'duplicate'
                }
              }

              // Preserve the original ledger observation and its consent.
              // The new Meta attempt records the later grant in consent_basis.
              // Its existing provider/idempotency key prevents duplicate sends.
              dispatches = dispatches.filter(
                dispatch => dispatch.provider === 'meta'
              )
            }

            const createdDispatchAttempts: CreatedProviderDispatchAttempt[] =
              []

            for (const dispatch of dispatches) {
              const attemptId =
                await transaction.insertDispatch(dispatch)

              if (attemptId && dispatch.status === 'pending') {
                createdDispatchAttempts.push({
                  adapterKey: `${dispatch.provider}:${dispatch.event_name}`,
                  attemptId
                })
              }
            }

            return {
              createdDispatchAttempts,
              status: inserted ? 'inserted' : 'duplicate'
            }
          })
      )
  }
}
