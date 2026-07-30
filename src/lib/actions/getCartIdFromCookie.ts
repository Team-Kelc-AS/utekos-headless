'use server'

import { publishCartIdentity } from '@/lib/cart/publishCartIdentity'

export async function getCartIdFromCookie(): Promise<
  string | null
> {
  const [{ readRawCartIdCookie }, cookieActions] =
    await Promise.all([
      import('@/lib/cart/readCartIdCookie'),
      import('@/lib/actions/setCartIdInCookie')
    ])
  const cartId = await readRawCartIdCookie()
  if (!cartId) return null

  const publicId = await publishCartIdentity(
    cartId,
    cookieActions.setCartIdInCookie,
    cookieActions.clearCartIdCookie
  )

  return publicId
}
