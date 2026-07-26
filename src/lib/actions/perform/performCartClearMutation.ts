'use server'

import { getCartLineIdsQuery } from '@/api/graphql/queries/cart/getCartLineIdsQuery'
import { getCartQuery } from '@/api/graphql/queries/cart/getCartQuery'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import { performCartLinesRemoveMutation } from '@/lib/actions/perform/performCartLinesRemoveMutation'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import type { ShopifyCartOperation, ShopifyOperation } from '@types'

type CartLineIdsOperation = ShopifyOperation<
  {
    cart: {
      lines: {
        nodes: Array<{ id: string }>
      }
    } | null
  },
  { cartId: string }
>

export async function performCartClearMutation(
  cartId: string
): Promise<StorefrontCart> {
  const lineIdsResult = await shopifyFetch<CartLineIdsOperation>({
    query: getCartLineIdsQuery,
    variables: { cartId }
  })

  if (!lineIdsResult.success) {
    throw new ShopifyApiError(
      'Failed to read cart lines in performCartClearMutation.',
      lineIdsResult.error.errors
    )
  }

  const cart = lineIdsResult.body.cart
  if (!cart) {
    throw new ShopifyApiError('Handlekurven finnes ikke lenger.')
  }

  const lineIds = cart.lines.nodes.map(line => line.id)
  if (lineIds.length > 0) {
    const clearedCart = await performCartLinesRemoveMutation(cartId, lineIds)
    if (!clearedCart) {
      throw new ShopifyApiError('Tømming av handlekurven returnerte ingen data.')
    }
    return clearedCart
  }

  const cartResult = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: { cartId }
  })

  if (!cartResult.success) {
    throw new ShopifyApiError(
      'Failed to read empty cart in performCartClearMutation.',
      cartResult.error.errors
    )
  }

  if (!cartResult.body.cart) {
    throw new ShopifyApiError('Handlekurven finnes ikke lenger.')
  }

  return cartResult.body.cart
}
