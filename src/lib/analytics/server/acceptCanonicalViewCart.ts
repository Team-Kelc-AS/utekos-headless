import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalViewCart,
  type CanonicalViewCartRequestContext
} from './normalizeCanonicalViewCart'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalViewCartStore = CanonicalEventStore

type AcceptCanonicalViewCartInput = {
  payload: unknown
  requestContext: CanonicalViewCartRequestContext
  store: CanonicalViewCartStore
}

export type AcceptCanonicalViewCartResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalViewCart(
  input: AcceptCanonicalViewCartInput
): Promise<AcceptCanonicalViewCartResult> {
  const event = normalizeCanonicalViewCart(
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
