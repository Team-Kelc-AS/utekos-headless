// Path: src/lib/actions/perform/performCartLinesRemoveMutation.ts
'use server'

import { mutationCartLinesRemove } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import type { ShopifyRemoveFromCartOperation } from '@types'

export const performCartLinesRemoveMutation = async (
  cartId: string,
  lineIds: string[]
): Promise<StorefrontCart> => {
  const result = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: mutationCartLinesRemove,
    variables: { cartId, lineIds }
  })

  if (!result.success) {
    throw new ShopifyApiError(
      'Failed to remove line from cart in performCartLinesRemoveMutation.',
      result.error.errors
    )
  }

  return getCartFromMutationPayload(
    'cartLinesRemove',
    result.body.cartLinesRemove
  )
}
