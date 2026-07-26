import type { CanonicalEvent } from '../canonicalEvent'
import type { CanonicalEventSourceEvidence } from './canonicalEventSourceEvidence'
import type { ProviderDispatchIntent } from './planCanonicalEventDispatch'
import type { ProviderAdapterKey } from './providerAdapter'

export type CanonicalStoredEvent = CanonicalEvent

export type CanonicalEventStoreInput = {
  dispatches: ProviderDispatchIntent[]
  event: CanonicalStoredEvent
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
