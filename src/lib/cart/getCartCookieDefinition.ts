import { CART_COOKIE_NAME } from '@/constants/cookies'

export function getCartCookieDefinition(
  fullCartId: string,
  isProduction: boolean
) {
  return {
    name: CART_COOKIE_NAME,
    value: fullCartId,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction,
    path: '/'
  }
}
