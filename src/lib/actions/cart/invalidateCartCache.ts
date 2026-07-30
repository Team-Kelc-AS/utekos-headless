import { updateTag } from 'next/cache'
import {
  getShopifyCartCacheTag,
  getShopifyCartLogReference
} from '@/lib/cart/getShopifyCartCacheTag'

export function invalidateCartCache(cartId: string): void {
  try {
    updateTag(getShopifyCartCacheTag(cartId))
    updateTag('cart')
  } catch (error) {
    console.error(
      `Shopify ${getShopifyCartLogReference(cartId)} ble oppdatert, men cache-invalidering feilet.`,
      {
        errorName:
          error instanceof Error ? error.name : 'UnknownError'
      }
    )
  }
}
