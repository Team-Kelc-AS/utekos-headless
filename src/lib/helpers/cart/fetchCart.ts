// Path: src/lib/helpers/cart/fetchCart.ts
import 'server-only'

import { getCartQuery } from '@/api/graphql/queries/cart/getCartQuery'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { CartNotFoundError } from '@/lib/errors/CartNotFoundError'
import { normalizeCart } from '@/lib/helpers/normalizers/normalizeCart'
import type { ShopifyCartOperation } from '@types'
import type { Cart } from 'types/cart'
import { getShopifyCartLogReference } from '@/lib/cart/getShopifyCartCacheTag'
import { redactShopifyCartSecrets } from '@/lib/cart/redactShopifyCartSecrets'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'

export const fetchRawCart = async (
  context: StorefrontBuyerContext,
  cartId: string
): Promise<StorefrontCart | null> => {
  const res = await storefrontGateway.buyerQuery<ShopifyCartOperation>({
    context,
    query: getCartQuery,
    variables: { cartId }
  })

  if (!res.success) {
    console.error(
      `Failed to fetch ${getShopifyCartLogReference(cartId)}:`,
      redactShopifyCartSecrets(JSON.stringify(res.error.errors))
    )
    return null
  }

  if (!res.body.cart) {
    console.warn(
      new CartNotFoundError(
        `${getShopifyCartLogReference(cartId)} was not found.`
      )
    )
    return null
  }

  return res.body.cart
}

export const fetchCart = async (
  context: StorefrontBuyerContext,
  cartId: string
): Promise<Cart | null> => {
  const cart = await fetchRawCart(context, cartId)

  return cart ? normalizeCart(cart) : null
}
