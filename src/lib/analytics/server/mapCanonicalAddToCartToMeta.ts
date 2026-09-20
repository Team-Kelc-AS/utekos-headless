import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalAddToCart } from '../addToCartEvent'
import { META_COMMERCE_EVENT_MAP } from '../metaCommerceEventMapping'
import { mapCanonicalCommerceEventToMeta } from './mapCanonicalCommerceEventToMeta'

export function mapCanonicalAddToCartToMeta(
  event: CanonicalAddToCart
): ServerEvent {
  return mapCanonicalCommerceEventToMeta(
    event,
    META_COMMERCE_EVENT_MAP.add_to_cart.server
  )
}
