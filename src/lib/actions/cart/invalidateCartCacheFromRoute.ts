import { revalidateTag } from 'next/cache'
import { getShopifyCartCacheTag } from '@/lib/cart/getShopifyCartCacheTag'

export function invalidateCartCacheFromRoute(
  cartId: string
): void {
  revalidateTag(getShopifyCartCacheTag(cartId), 'max')
  revalidateTag('cart', 'max')
}
