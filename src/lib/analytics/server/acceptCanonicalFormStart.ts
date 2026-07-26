import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalFormStart,
  type CanonicalFormStartRequestContext
} from './normalizeCanonicalFormStart'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalFormStartStore = CanonicalEventStore

type AcceptCanonicalFormStartInput = {
  payload: unknown
  requestContext: CanonicalFormStartRequestContext
  store: CanonicalFormStartStore
}

export type AcceptCanonicalFormStartResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalFormStart(
  input: AcceptCanonicalFormStartInput
): Promise<AcceptCanonicalFormStartResult> {
  const event = normalizeCanonicalFormStart(
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
