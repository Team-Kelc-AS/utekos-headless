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

export type CartReadResult =
  | { status: 'ready'; cart: Cart }
  | { status: 'not-found' }
  | { status: 'unavailable' }

type RawCartReadResult =
  | { status: 'ready'; cart: StorefrontCart }
  | { status: 'not-found' }
  | { status: 'unavailable' }

async function readRawCart(
  context: StorefrontBuyerContext,
  cartId: string
): Promise<RawCartReadResult> {
  const res =
    await storefrontGateway.buyerQuery<ShopifyCartOperation>({
      context,
      query: getCartQuery,
      variables: { cartId }
    })

  if (!res.success) {
    console.error(
      `Failed to fetch ${getShopifyCartLogReference(cartId)}:`,
      redactShopifyCartSecrets(JSON.stringify(res.error.errors))
    )
    return { status: 'unavailable' }
  }

  if (!res.body.cart) {
    console.warn(
      new CartNotFoundError(
        `${getShopifyCartLogReference(cartId)} was not found.`
      )
    )
    return { status: 'not-found' }
  }

  return { status: 'ready', cart: res.body.cart }
}

export const fetchRawCart = async (
  context: StorefrontBuyerContext,
  cartId: string
): Promise<StorefrontCart | null> => {
  const result = await readRawCart(context, cartId)
  return result.status === 'ready' ? result.cart : null
}

export async function fetchCartReadResult(
  context: StorefrontBuyerContext,
  cartId: string
): Promise<CartReadResult> {
  const result = await readRawCart(context, cartId)

  if (result.status !== 'ready') return result

  return { status: 'ready', cart: normalizeCart(result.cart) }
}

export const fetchCart = async (
  context: StorefrontBuyerContext,
  cartId: string
): Promise<Cart | null> => {
  const result = await fetchCartReadResult(context, cartId)

  return result.status === 'ready' ? result.cart : null
}
