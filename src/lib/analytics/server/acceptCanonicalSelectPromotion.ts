import type { CanonicalEventStore } from './canonicalEventStore'
import {
  normalizeCanonicalSelectPromotion,
  type CanonicalSelectPromotionRequestContext
} from './normalizeCanonicalSelectPromotion'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalSelectPromotionStore = CanonicalEventStore

type AcceptCanonicalSelectPromotionInput = {
  payload: unknown
  requestContext: CanonicalSelectPromotionRequestContext
  store: CanonicalSelectPromotionStore
}

export type AcceptCanonicalSelectPromotionResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalSelectPromotion(
  input: AcceptCanonicalSelectPromotionInput
): Promise<AcceptCanonicalSelectPromotionResult> {
  const event = normalizeCanonicalSelectPromotion(
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
