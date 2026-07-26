import type {
  CanonicalEventAcceptance,
  CanonicalEventStore,
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

export type CanonicalEventTransaction = {
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
          await transaction.upsertSourceEvidence(sourceEvidence)
        }

        if (!inserted) {
          return {
            createdDispatchAttempts: [],
            status: 'duplicate'
          }
        }

        const createdDispatchAttempts: CreatedProviderDispatchAttempt[] = []

        for (const dispatch of rows.dispatches) {
          const attemptId = await transaction.insertDispatch(dispatch)

          if (attemptId && dispatch.status === 'pending') {
            createdDispatchAttempts.push({
              adapterKey: `${dispatch.provider}:${dispatch.event_name}`,
              attemptId
            })
          }
        }

        return {
          createdDispatchAttempts,
          status: 'inserted'
        }
      })
  }
}
