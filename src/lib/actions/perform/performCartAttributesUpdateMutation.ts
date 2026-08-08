import 'server-only'

import { mutationCartAttributesUpdate } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import type { ShopifyCartAttributesUpdateOperation } from '@types'

type CartAttribute = { key: string; value: string }

export const performCartAttributesUpdateMutation = async (
  context: StorefrontBuyerContext,
  cartId: string,
  attributes: CartAttribute[]
): Promise<StorefrontCart | null> => {
  if (attributes.length === 0) {
    return null
  }

  const result =
    await storefrontGateway.mutation<ShopifyCartAttributesUpdateOperation>({
      context,
      query: mutationCartAttributesUpdate,
      variables: { cartId, attributes }
    })

  if (!result.success) {
    throw new ShopifyApiError(
      'Failed to update cart attributes in performCartAttributesUpdateMutation.',
      result.error.errors
    )
  }

  return getCartFromMutationPayload(
    'cartAttributesUpdate',
    result.body.cartAttributesUpdate
  )
}
