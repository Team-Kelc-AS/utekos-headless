import 'server-only'

import { mutationCartDiscountCodesUpdate } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import type { ShopifyDiscountCodesUpdateOperation } from '@types'

export async function performCartDiscountCodesUpdateMutation(
  context: StorefrontBuyerContext,
  cartId: string,
  discountCodes: string[]
): Promise<StorefrontCart> {
  const result =
    await storefrontGateway.mutation<ShopifyDiscountCodesUpdateOperation>({
      context,
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
