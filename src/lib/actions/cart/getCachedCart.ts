// Path: src/lib/helpers/getCachedCart.ts
'use server'

import { parseShopifyCartId } from '@/lib/cart/parseShopifyCartId'
import { shopifyPublicCartIdSchema } from '@/lib/cart/shopifyPublicCartIdSchema'
import type { Cart } from 'types/cart'
import { getStorefrontBuyerContext } from '@/api/shopify/storefront/getStorefrontBuyerContext'

async function getCartReadResult(
  cartId: string
): Promise<
  | { status: 'ready'; cart: Cart }
  | { status: 'not-found' }
  | { status: 'unavailable' }
> {
  const { fetchCartReadResult } =
    await import('@/lib/helpers/cart/fetchCart')
  const context = await getStorefrontBuyerContext()
  return fetchCartReadResult(context, cartId)
}

export type CachedCartReadResult =
  | { status: 'ready'; cartId: string; cart: Cart | null }
  | {
      status: 'identity-changed'
      cartId: string | null
      cart: null
    }

export async function getCachedCart(
  expectedPublicCartId: string
): Promise<CachedCartReadResult> {
  const expected = shopifyPublicCartIdSchema.safeParse(
    expectedPublicCartId
  )
  const { readCartIdCookie } =
    await import('@/lib/cart/readCartIdCookie')
  const cartId = await readCartIdCookie()
  const identity = parseShopifyCartId(cartId)

  if (
    !expected.success ||
    !identity ||
    identity.publicId !== expected.data
  ) {
    return {
      status: 'identity-changed',
      cartId: identity?.publicId ?? null,
      cart: null
    }
  }

  const result = await getCartReadResult(identity.fullId)

  if (result.status === 'not-found') {
    const { clearCartIdCookie } =
      await import('@/lib/actions/cart/setCartIdInCookie')
    await clearCartIdCookie()

    return {
      status: 'identity-changed',
      cartId: null,
      cart: null
    }
  }

  return {
    status: 'ready',
    cartId: identity.publicId,
    cart: result.status === 'ready' ? result.cart : null
  }
}
