// Path: src/lib/actions/perform/performCartLinesUpdateMutation.ts
import 'server-only'

import { mutationCartLinesUpdate } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import type { ShopifyUpdateCartLineQuantityOperation } from '@types'
import type { UpdateCartLineInput } from 'types/cart'

export const performCartLinesUpdateMutation = async (
  context: StorefrontBuyerContext,
  cartId: string,
  input: UpdateCartLineInput
): Promise<StorefrontCart> => {
  const lines = [{ id: input.lineId, quantity: input.quantity }]

  const result =
    await storefrontGateway.mutation<ShopifyUpdateCartLineQuantityOperation>({
      context,
      query: mutationCartLinesUpdate,
      variables: { cartId, lines }
    })

  if (!result.success) {
    throw new ShopifyApiError(
      'Failed to update lines in cart in performCartLinesUpdateMutation.',
      result.error.errors
    )
  }

  return getCartFromMutationPayload(
    'cartLinesUpdate',
    result.body.cartLinesUpdate
  )
}
