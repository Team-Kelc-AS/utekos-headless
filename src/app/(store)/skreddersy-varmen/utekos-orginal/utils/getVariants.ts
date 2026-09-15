import { flattenConnection } from '@shopify/hydrogen-react/flatten-connection'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'

export function getVariants(product: ShopifyProduct | undefined | null) {
  if (!product?.variants) return []

  const variants = product.variants as
    | ShopifyProduct['variants']
    | ShopifyProductVariant[]

  return Array.isArray(variants) ? variants : flattenConnection(variants)
}
