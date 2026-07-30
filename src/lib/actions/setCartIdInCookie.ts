import 'server-only'

import { cookies } from 'next/headers'

import { getCartCookieDefinition } from '@/lib/cart/getCartCookieDefinition'
import { parseShopifyCartId } from '@/lib/cart/parseShopifyCartId'

export async function setCartIdInCookie(
  cartId: string
): Promise<void> {
  const fullCartId = parseShopifyCartId(cartId)?.fullId
  if (!fullCartId) {
    throw new Error(
      'Shopify returned an invalid cart identifier.'
    )
  }

  const cookieStore = await cookies()
  cookieStore.set(
    getCartCookieDefinition(
      fullCartId,
      process.env.NODE_ENV === 'production'
    )
  )
}

export async function clearCartIdCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set({
    ...getCartCookieDefinition(
      '',
      process.env.NODE_ENV === 'production'
    ),
    expires: new Date(0),
    maxAge: 0
  })
}
