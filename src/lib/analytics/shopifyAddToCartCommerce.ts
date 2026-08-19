import { sha256Hex } from '@/lib/crypto/sha256Hex'
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

export async function createCartMutationId(input: {
  cartId: string
  cartUpdatedAt?: string
  mutationTimestamp: string
  quantity: number
  variantId: string
}) {
  const hash = await sha256Hex(
    [
      input.cartId,
      input.variantId,
      String(input.quantity),
      input.cartUpdatedAt ?? input.mutationTimestamp
    ].join('|')
  )

  return `cart_mut_${hash.slice(0, 32)}`
}

export async function mapShopifyAddToCart(
  input: MapShopifyAddToCartInput
): Promise<CanonicalAddToCartCommerce> {
  const commerce = mapShopifyViewItem({
    product: input.product,
    variant: input.variant,
    quantity: input.quantity
  })

  return {
    ...commerce,
    cart_id: input.cartId,
    cart_mutation_id: await createCartMutationId({
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
