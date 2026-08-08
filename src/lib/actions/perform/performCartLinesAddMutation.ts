// Path: src/lib/actions/perform/performCartLinesAddMutation.ts
import 'server-only'

import { mutationCartLinesAdd } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import type { ShopifyAddToCartOperation } from '@types'

export const performCartLinesAddMutation = async (
  context: StorefrontBuyerContext,
  cartId: string,
  lines: { variantId: string; quantity: number }[]
): Promise<StorefrontCart> => {
  const result = await storefrontGateway.mutation<ShopifyAddToCartOperation>({
    context,
    query: mutationCartLinesAdd,
    variables: {
      cartId,
      lines: lines.map(line => ({
        merchandiseId: line.variantId,
        quantity: line.quantity
      }))
    }
  })

  if (!result.success) {
    throw new ShopifyApiError(
      'Failed to add lines in performCartLinesAddMutation.',
      result.error.errors
    )
  }

  return getCartFromMutationPayload(
    'cartLinesAdd',
    result.body.cartLinesAdd
  )
}
