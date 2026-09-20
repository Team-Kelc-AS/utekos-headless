import type { CanonicalAddToCart } from '../addToCartEvent'
import { GOOGLE_COMMERCE_EVENT_MAP } from '../googleCommerceEventMapping'
import { mapCanonicalCommerceEventToGoogleDataManager } from './mapCanonicalCommerceEventToGoogleDataManager'

export function mapCanonicalAddToCartToGoogleDataManager(
  event: CanonicalAddToCart
) {
  return mapCanonicalCommerceEventToGoogleDataManager(
    event,
    GOOGLE_COMMERCE_EVENT_MAP.add_to_cart.server
  )
}
