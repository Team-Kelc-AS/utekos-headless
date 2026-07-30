// Path: src/lib/helpers/getCachedCart.ts
'use server'

import { CartNotFoundError } from '@/lib/errors/CartNotFoundError'
import { parseShopifyCartId } from '@/lib/cart/parseShopifyCartId'
import { shopifyPublicCartIdSchema } from '@/lib/cart/shopifyPublicCartIdSchema'
import type { Cart } from 'types/cart'

async function getCartById(
  cartId: string
): Promise<Cart | null> {
  try {
    const { fetchCart } =
      await import('@/lib/helpers/cart/fetchCart')
    const cart = await fetchCart(cartId)
    return cart
  } catch (error) {
    if (error instanceof CartNotFoundError) {
      return null
    }
    throw error
  }
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

  return {
    status: 'ready',
    cartId: identity.publicId,
    cart: await getCartById(identity.fullId)
  }
}
