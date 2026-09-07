import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalAddToWishlist,
  type CanonicalAddToWishlistRequestContext
} from './normalizeCanonicalAddToWishlist'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import { logCanonicalCommerceEvent } from '@/lib/observability/logging/logCanonicalCommerceEvent'

export type CanonicalAddToWishlistStore = CanonicalEventStore

type AcceptCanonicalAddToWishlistInput = {
  payload: unknown
  requestContext: CanonicalAddToWishlistRequestContext
  store: CanonicalAddToWishlistStore
}

export type AcceptCanonicalAddToWishlistResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalAddToWishlist(
  input: AcceptCanonicalAddToWishlistInput
): Promise<AcceptCanonicalAddToWishlistResult> {
  const event = normalizeCanonicalAddToWishlist(
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

  await logCanonicalCommerceEvent({
    event,
    eventName: 'add_to_wishlist',
    source: 'browser_collector',
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate'
  })

  return {
    event_id: event.event_id,
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate'
  }
}
