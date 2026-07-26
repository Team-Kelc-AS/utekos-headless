'use server'

import { mutationCartCreate } from '@/api/graphql/mutations/cart'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { getCartFromMutationPayload } from '@/lib/actions/cart/getCartFromMutationPayload'
import type { ShopifyCreateCartOperation } from '@types'

export const performCartCreateMutation = async (
  lines: { variantId: string; quantity: number }[],
  discountCode?: string
): Promise<StorefrontCart> => {
  const result = await shopifyFetch<ShopifyCreateCartOperation>({
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

  return getCartFromMutationPayload('cartCreate', result.body.cartCreate)
}
