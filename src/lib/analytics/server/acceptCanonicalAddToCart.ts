import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalAddToCart,
  type CanonicalAddToCartRequestContext
} from './normalizeCanonicalAddToCart'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalAddToCartStore = CanonicalEventStore

type AcceptCanonicalAddToCartInput = {
  payload: unknown
  requestContext: CanonicalAddToCartRequestContext
  store: CanonicalAddToCartStore
}

export type AcceptCanonicalAddToCartResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalAddToCart(
  input: AcceptCanonicalAddToCartInput
): Promise<AcceptCanonicalAddToCartResult> {
  const event = normalizeCanonicalAddToCart(
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
