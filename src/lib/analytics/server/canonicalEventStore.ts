import type { CanonicalEvent } from '../canonicalEvent'
import type { CanonicalEventSourceEvidence } from './canonicalEventSourceEvidence'
import type { ProviderDispatchIntent } from './planCanonicalEventDispatch'
import type {
  ProviderAdapterKey,
  ProviderId
} from './providerAdapter'

export type CanonicalStoredEvent = CanonicalEvent

export type CanonicalEventStoreInput = {
  allowPageViewMarketingRelease?: boolean
  dispatches: ProviderDispatchIntent[]
  event: CanonicalStoredEvent
  /**
   * Re-create only missing provider attempts for an already persisted
   * canonical event. Existing provider/idempotency keys remain no-ops.
   * The caller must resolve the immutable canonical event from the ledger;
   * this option must never promote an unverified observation into truth.
   */
  releaseProvidersOnDuplicate?: readonly ProviderId[]
  sourceEvidence?: CanonicalEventSourceEvidence
}

export type CreatedProviderDispatchAttempt = {
  adapterKey: ProviderAdapterKey
  attemptId: string
}

export type CanonicalEventAcceptance = {
  createdDispatchAttempts: CreatedProviderDispatchAttempt[]
  status: 'duplicate' | 'inserted'
}

export type CanonicalEventLookup = Pick<
  CanonicalEvent,
  'event_id' | 'event_name'
>

export type CanonicalEventStore = {
  accept: (
    input: CanonicalEventStoreInput
  ) => Promise<CanonicalEventAcceptance>
  find?: (
    input: CanonicalEventLookup
  ) => Promise<CanonicalStoredEvent | null>
}
