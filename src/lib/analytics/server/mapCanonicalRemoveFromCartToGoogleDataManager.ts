import type { CanonicalRemoveFromCart } from '../removeFromCartEvent'
import { mapCanonicalCommerceEventToGoogleDataManager } from './mapCanonicalCommerceEventToGoogleDataManager'

export function mapCanonicalRemoveFromCartToGoogleDataManager(
  event: CanonicalRemoveFromCart
) {
  return mapCanonicalCommerceEventToGoogleDataManager(
    event,
    'remove_from_cart'
  )
}
