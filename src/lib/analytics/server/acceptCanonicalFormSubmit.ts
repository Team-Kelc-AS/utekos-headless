import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalFormSubmit,
  type CanonicalFormSubmitRequestContext
} from './normalizeCanonicalFormSubmit'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalFormSubmitStore = CanonicalEventStore

type AcceptCanonicalFormSubmitInput = {
  payload: unknown
  requestContext: CanonicalFormSubmitRequestContext
  store: CanonicalFormSubmitStore
}

export type AcceptCanonicalFormSubmitResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalFormSubmit(
  input: AcceptCanonicalFormSubmitInput
): Promise<AcceptCanonicalFormSubmitResult> {
  const event = normalizeCanonicalFormSubmit(
    input.payload,
    input.requestContext
  )
  const hasPermittedPurpose =
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'

  if (!hasPermittedPurpose) {
    return { reason: 'consent_denied', status: 'rejected' }
  }

  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event
  })

  return {
    event_id: event.event_id,
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate'
  }
}
