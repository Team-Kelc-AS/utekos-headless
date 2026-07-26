import type { CanonicalEventStore } from './canonicalEventStore'
import type { CanonicalEventSourceEvidence } from './canonicalEventSourceEvidence'
import {
  normalizeCanonicalRemoveFromCart,
  type CanonicalRemoveFromCartRequestContext
} from './normalizeCanonicalRemoveFromCart'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalRemoveFromCartStore = CanonicalEventStore

type AcceptCanonicalRemoveFromCartInput = {
  payload: unknown
  requestContext: CanonicalRemoveFromCartRequestContext
  sourceEvidence?: CanonicalEventSourceEvidence
  store: CanonicalRemoveFromCartStore
}

export type AcceptCanonicalRemoveFromCartResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

export async function acceptCanonicalRemoveFromCart(
  input: AcceptCanonicalRemoveFromCartInput
): Promise<AcceptCanonicalRemoveFromCartResult> {
  const event = normalizeCanonicalRemoveFromCart(
    input.payload,
    input.requestContext
  )
  const isWebhookSource = event.source === 'webhook'
  const hasPermittedPurpose =
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'

  // Browser path stays consent-gated. Webhook ledger writes are
  // operational; provider outbox still respects consent + matrix.
  if (!isWebhookSource && !hasPermittedPurpose) {
    return { reason: 'consent_denied', status: 'rejected' }
  }

  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event,
    ...(input.sourceEvidence ?
      { sourceEvidence: input.sourceEvidence }
    : {})
  })

  return {
    event_id: event.event_id,
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate'
  }
}
