// Path: src/lib/actions/perform/performCartLinesRemoveMutation.ts
import 'server-only'

import { mutationCartLinesRemove } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import type { ShopifyRemoveFromCartOperation } from '@types'

export const performCartLinesRemoveMutation = async (
  context: StorefrontBuyerContext,
  cartId: string,
  lineIds: string[]
): Promise<StorefrontCart> => {
  const result =
    await storefrontGateway.mutation<ShopifyRemoveFromCartOperation>({
      context,
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
