import type { StorefrontProduct } from '@/api/shopify/types/storefrontApi'
import type { ShopifyProduct } from 'types/product'
import { reshapeProduct } from './reshapeProduct'

/**
 * Transforms an array of raw Shopify products using the reshapeProduct utility.
 */
export const reshapeProducts = (
  products: StorefrontProduct[]
): ShopifyProduct[] => {
  return products.map(product => reshapeProduct(product))
}
