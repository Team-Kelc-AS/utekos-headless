import { createHash } from 'node:crypto'

function hashShopifyCartId(cartId: string): string {
  return createHash('sha256').update(cartId).digest('hex')
}

export function getShopifyCartCacheTag(cartId: string): string {
  return `cart-${hashShopifyCartId(cartId)}`
}

export function getShopifyCartLogReference(
  cartId: string
): string {
  return `cart:${hashShopifyCartId(cartId).slice(0, 12)}`
}
