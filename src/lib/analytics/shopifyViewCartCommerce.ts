import { mapShopifyBeginCheckout } from './shopifyBeginCheckoutCommerce'
import type { CanonicalViewCartCustomData } from './viewCartEvent'
import type { Cart } from 'types/cart'

export function mapShopifyViewCart(
  cart: Cart,
  viewSequence: number
): CanonicalViewCartCustomData {
  const commerce = mapShopifyBeginCheckout(cart)

  return {
    currency: commerce.currency,
    value: commerce.value,
    gross_value: commerce.gross_value,
    tax_value: commerce.tax_value,
    items: commerce.items,
    cart_id: cart.id,
    view_sequence: viewSequence
  }
}

let viewSequenceCounter = 0

export function nextViewCartSequence() {
  viewSequenceCounter += 1
  return viewSequenceCounter
}
