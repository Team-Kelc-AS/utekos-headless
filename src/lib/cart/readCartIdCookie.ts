import 'server-only'

import { cookies } from 'next/headers'

import { CART_COOKIE_NAME } from '@/constants/cookies'
import { parseShopifyCartId } from '@/lib/cart/parseShopifyCartId'

export async function readCartIdCookie(): Promise<
  string | null
> {
  const value = await readRawCartIdCookie()

  return parseShopifyCartId(value)?.fullId ?? null
}

export async function readRawCartIdCookie(): Promise<
  string | null
> {
  const cookieStore = await cookies()
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null
}
