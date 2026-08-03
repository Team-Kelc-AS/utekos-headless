import { createHash } from 'node:crypto'
import type { ShopifyCheckoutObservation } from '../shopifyCheckoutObservationContract'

export function createShopifyCheckoutObservationPayloadSha256(
  observation: ShopifyCheckoutObservation
) {
  return createHash('sha256')
    .update(JSON.stringify(observation), 'utf8')
    .digest('hex')
}
