import { sha256Hex } from '@/lib/crypto/sha256Hex'
import { mapShopifyCartValueCommerce } from './mapShopifyCartValueCommerce'
import type { CanonicalBeginCheckoutCommerce } from './beginCheckoutEvent'
import type { Cart } from 'types/cart'

export { resolveCheckoutId } from './mapShopifyCartValueCommerce'

export async function createCheckoutCreationRevision(
  checkoutId: string,
  checkoutUrl: string
) {
  const hash = await sha256Hex([checkoutId, checkoutUrl].join('|'))

  return `checkout_rev_${hash.slice(0, 32)}`
}

export async function mapShopifyBeginCheckout(
  cart: Cart
): Promise<CanonicalBeginCheckoutCommerce> {
  const commerce = mapShopifyCartValueCommerce(cart)

  return {
    ...commerce,
    creation_revision: await createCheckoutCreationRevision(
      commerce.checkout_id,
      cart.checkoutUrl
    )
  }
}
