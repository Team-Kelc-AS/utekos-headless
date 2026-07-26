'use server'

import { mutationCartDiscountCodesUpdate } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import type { ShopifyDiscountCodesUpdateOperation } from '@types'

export async function performCartDiscountCodesUpdateMutation(
  cartId: string,
  discountCodes: string[]
): Promise<StorefrontCart> {
  const result = await shopifyFetch<ShopifyDiscountCodesUpdateOperation>({
    query: mutationCartDiscountCodesUpdate,
    variables: { cartId, discountCodes }
  })

  if (!result.success) {
    throw new ShopifyApiError(
      'Failed to update discount codes in performCartDiscountCodesUpdateMutation.',
      result.error.errors
    )
  }

  return getCartFromMutationPayload(
    'cartDiscountCodesUpdate',
    result.body.cartDiscountCodesUpdate
  )
}
