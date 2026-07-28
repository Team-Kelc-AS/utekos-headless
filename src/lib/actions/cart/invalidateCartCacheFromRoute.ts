import { revalidateTag } from 'next/cache'

export function invalidateCartCacheFromRoute(cartId: string): void {
  revalidateTag(`cart-${cartId}`, 'max')
  revalidateTag('cart', 'max')
}
