import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import {
  canonicalPurchaseSchema,
  type CanonicalPurchase
} from '../purchaseEvent'
import type { CheckoutJourneyLinkReason } from '../checkoutJourneyLinkReason'
import type { CanonicalEventStore } from './canonicalEventStore'

const MAX_SOURCE_GAP_MS = 24 * 60 * 60 * 1_000

export async function linkCanonicalPurchaseJourney(
  event: CanonicalPurchase,
  store: Pick<CanonicalEventStore, 'find'>
): Promise<CanonicalPurchase> {
  const unlinked = (reason: CheckoutJourneyLinkReason) => ({
    ...event,
    journey_link_reason: reason
  })
  if (event.consent.analytics !== 'granted') {
    return unlinked('analytics_consent_not_granted')
  }
  if (!event.begin_checkout_event_id) {
    return unlinked('begin_checkout_event_id_missing')
  }
  if (!store.find) return unlinked('lookup_unavailable')

  try {
    // Keep linkage immutable on retries; a late source must not rewrite a paid event.
    const previous = await store.find({
      event_id: event.event_id,
      event_name: 'purchase'
    })
    if (previous?.event_name === 'purchase') {
      return canonicalPurchaseSchema.parse({
        ...event,
        ...(previous.journey_id ?
          { journey_id: previous.journey_id }
        : {}),
        ...(previous.page_view_id ?
          { page_view_id: previous.page_view_id }
        : {}),
        ...(previous.journey_link_reason ?
          { journey_link_reason: previous.journey_link_reason }
        : {})
      })
    }
    const source = await store.find({
      event_id: event.begin_checkout_event_id,
      event_name: 'begin_checkout'
    })
    if (!source) return unlinked('begin_checkout_not_found')
    const parsed = canonicalBeginCheckoutSchema.safeParse(source)
    if (!parsed.success)
      return unlinked('begin_checkout_mismatch')
    const begin = parsed.data
    const gap =
      Date.parse(event.event_time) - Date.parse(begin.event_time)
    if (
      begin.event_id !== event.begin_checkout_event_id ||
      begin.environment !== event.environment ||
      begin.consent.analytics !== 'granted' ||
      begin.custom_data.currency !==
        event.custom_data.currency ||
      gap < 0 ||
      gap > MAX_SOURCE_GAP_MS
    )
      return unlinked('begin_checkout_mismatch')
    if (!begin.journey_id)
      return unlinked('begin_checkout_journey_missing')
    return canonicalPurchaseSchema.parse({
      ...event,
      journey_id: begin.journey_id,
      ...(begin.page_view_id ?
        { page_view_id: begin.page_view_id }
      : {}),
      journey_link_reason: 'linked'
    })
  } catch {
    // A failed analytics lookup must not prevent recording the paid order.
    return unlinked('lookup_unavailable')
  }
}
