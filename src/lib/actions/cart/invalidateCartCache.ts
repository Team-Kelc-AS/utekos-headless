import { updateTag } from 'next/cache'

export function invalidateCartCache(cartId: string): void {
  try {
    updateTag(`cart-${cartId}`)
    updateTag('cart')
  } catch (error) {
    console.error(
      `Shopify cart ${cartId} ble oppdatert, men cache-invalidering feilet.`,
      error
    )
  }
}
