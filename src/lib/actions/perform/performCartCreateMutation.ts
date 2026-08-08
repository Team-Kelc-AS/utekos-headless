import 'server-only'

import { mutationCartCreate } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import type { ShopifyCreateCartOperation } from '@types'

export const performCartCreateMutation = async (
  context: StorefrontBuyerContext,
  lines: { variantId: string; quantity: number }[],
  discountCode?: string
): Promise<StorefrontCart> => {
  const result = await storefrontGateway.mutation<ShopifyCreateCartOperation>({
    context,
    query: mutationCartCreate,
    variables: {
      lines: lines.map(line => ({
        merchandiseId: line.variantId,
        quantity: line.quantity
      })),
      ...(discountCode && { discountCodes: [discountCode] })
    }
  })

  if (!result.success) {
    throw new ShopifyApiError(
      'Failed to create cart in performCartCreateMutation.',
      result.error.errors
    )
  }

  return getCartFromMutationPayload(
    'cartCreate',
    result.body.cartCreate
  )
}
