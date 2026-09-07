import type { CanonicalPurchase } from '../purchaseEvent'
import type { CanonicalEventStore } from './canonicalEventStore'
import type { CanonicalEventSourceEvidence } from './canonicalEventSourceEvidence'
import {
  normalizeCanonicalPurchase,
  type CanonicalPurchaseRequestContext
} from './normalizeCanonicalPurchase'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import { linkCanonicalPurchaseJourney } from './linkCanonicalPurchaseJourney'
import { logCanonicalCommerceEvent } from '@/lib/observability/logging/logCanonicalCommerceEvent'

export type CanonicalPurchaseStore = CanonicalEventStore

type AcceptCanonicalPurchaseInput = {
  payload: unknown
  requestContext: CanonicalPurchaseRequestContext
  sourceEvidence: CanonicalEventSourceEvidence
  store: CanonicalPurchaseStore
}

export type AcceptCanonicalPurchaseResult = {
  event_id: string
  status: 'accepted' | 'duplicate'
}

export async function acceptCanonicalPurchase(
  input: AcceptCanonicalPurchaseInput
): Promise<AcceptCanonicalPurchaseResult> {
  const normalized = normalizeCanonicalPurchase(
    input.payload,
    input.requestContext
  )
  const event = await linkCanonicalPurchaseJourney(
    normalized,
    input.store
  )
  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event: event as CanonicalPurchase,
    sourceEvidence: input.sourceEvidence
  })
  await logCanonicalCommerceEvent({
    event,
    eventName: 'purchase',
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate',
    source:
      input.sourceEvidence.source_method === 'webhook' ?
        'shopify_paid_order_webhook'
      : 'shopify_paid_order_reconciliation',
    ...(event.journey_link_reason ?
      { journeyLinkReason: event.journey_link_reason }
    : {})
  })

  return {
    event_id: event.event_id,
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate'
  }
}
