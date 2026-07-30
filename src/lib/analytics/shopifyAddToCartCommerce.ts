import { createHash } from 'node:crypto'
import { mapShopifyViewItem } from './shopifyViewItemCommerce'
import type { CanonicalAddToCartCommerce } from './addToCartEvent'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type MapShopifyAddToCartInput = {
  cartId: string
  cartUpdatedAt?: string
  mutationTimestamp: string
  product: ProductCommerceModel
  quantity: number
  variant: ProductPurchaseVariant
}

export function createCartMutationId(input: {
  cartId: string
  cartUpdatedAt?: string
  mutationTimestamp: string
  quantity: number
  variantId: string
}) {
  const material = [
    input.cartId,
    input.variantId,
    String(input.quantity),
    input.cartUpdatedAt ?? input.mutationTimestamp
  ].join('|')
  const hash = createHash('sha256').update(material).digest('hex')

  return `cart_mut_${hash.slice(0, 32)}`
}

export function mapShopifyAddToCart(
  input: MapShopifyAddToCartInput
): CanonicalAddToCartCommerce {
  const commerce = mapShopifyViewItem({
    product: input.product,
    variant: input.variant,
    quantity: input.quantity
  })

  return {
    ...commerce,
    cart_id: input.cartId,
    cart_mutation_id: createCartMutationId({
      cartId: input.cartId,
      ...(input.cartUpdatedAt ?
        { cartUpdatedAt: input.cartUpdatedAt }
      : {}),
      mutationTimestamp: input.mutationTimestamp,
      quantity: input.quantity,
      variantId: input.variant.id
    })
  }
}
