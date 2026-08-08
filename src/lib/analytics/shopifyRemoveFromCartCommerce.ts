import { createCartMutationId } from './shopifyAddToCartCommerce'
import { UTEKOS_NORWAY_PRICE_CONTEXT } from './shopifyViewItemCommerce'
import { mapCartVariantCommerce } from './mapCartVariantCommerce'
import type { CanonicalRemoveFromCartCustomData } from './removeFromCartEvent'
import type { CartProductVariant } from 'types/cart/CartProductVariant'
import type { CartProduct } from 'types/cart'

export type MapShopifyRemoveFromCartInput = {
  cartId: string
  mutationTimestamp: string
  product: CartProduct
  quantity: number
  variant: CartProductVariant
}

export function mapShopifyRemoveFromCart(
  input: MapShopifyRemoveFromCartInput
): CanonicalRemoveFromCartCustomData {
  const commerce = mapCartVariantCommerce({
    product: input.product,
    variant: input.variant,
    quantity: input.quantity,
    priceContext: UTEKOS_NORWAY_PRICE_CONTEXT
  })

  return {
    ...commerce,
    cart_id: input.cartId,
    cart_mutation_id: createCartMutationId({
      cartId: input.cartId,
      mutationTimestamp: input.mutationTimestamp,
      quantity: input.quantity,
      variantId: input.variant.id
    })
  }
}
