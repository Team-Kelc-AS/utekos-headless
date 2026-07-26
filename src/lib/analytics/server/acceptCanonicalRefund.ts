import type { CanonicalEvent } from '../canonicalEvent'
import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId
} from '../purchaseEvent'
import type { CanonicalEventStore } from './canonicalEventStore'
import type { CanonicalEventSourceEvidence } from './canonicalEventSourceEvidence'
import { readCanonicalRefundShopifyIdentity } from './assertCanonicalRefundIdentity'
import { enrichCanonicalRefundFromPurchase } from './enrichCanonicalRefundFromPurchase'
import {
  normalizeCanonicalRefund,
  type CanonicalRefundRequestContext
} from './normalizeCanonicalRefund'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type CanonicalRefundStore = CanonicalEventStore

type AcceptCanonicalRefundInput = {
  payload: unknown
  requestContext: CanonicalRefundRequestContext
  sourceEvidence: CanonicalEventSourceEvidence
  store: CanonicalRefundStore
}

export type AcceptCanonicalRefundResult = {
  event_id: string
  status: 'accepted' | 'duplicate'
}

export async function acceptCanonicalRefund(
  input: AcceptCanonicalRefundInput
): Promise<AcceptCanonicalRefundResult> {
  const normalizedEvent = normalizeCanonicalRefund(
    input.payload,
    input.requestContext
  )
  const { orderLegacyId } =
    readCanonicalRefundShopifyIdentity(normalizedEvent)
  const linkedPurchase =
    input.store.find === undefined ?
      null
    : await input.store.find({
        event_id: deterministicPurchaseEventId(orderLegacyId),
        event_name: 'purchase'
      })
  const event =
    linkedPurchase === null ? normalizedEvent : (
      enrichCanonicalRefundFromPurchase(
        normalizedEvent,
        canonicalPurchaseSchema.parse(linkedPurchase)
      )
    )
  const storedEvent = event as unknown as CanonicalEvent
  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(storedEvent),
    event: storedEvent,
    sourceEvidence: input.sourceEvidence
  })

  return {
    event_id: event.event_id,
    status:
      result.status === 'inserted' ? 'accepted' : 'duplicate'
  }
}
