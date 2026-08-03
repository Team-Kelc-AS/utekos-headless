import type { ShopifyCheckoutObservation } from '../shopifyCheckoutObservationContract'

export function createShopifyCheckoutObservationIdempotencyKey(
  observation: ShopifyCheckoutObservation
) {
  return [
    observation.contract,
    observation.schemaVersion,
    observation.source,
    observation.eventName,
    observation.eventId
  ].join(':')
}
