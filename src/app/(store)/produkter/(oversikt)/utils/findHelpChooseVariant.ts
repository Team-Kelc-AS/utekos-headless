import { flattenConnection } from '@shopify/hydrogen-react/flatten-connection'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'

type ProductVariantsShape =
  | ShopifyProductVariant[]
  | {
      nodes?: ShopifyProductVariant[]
      edges?: Array<{ node: ShopifyProductVariant }>
    }

export function normalizeHelpChooseVariants(
  product: ShopifyProduct
): ShopifyProductVariant[] {
  const variants = product.variants as ProductVariantsShape
  if (Array.isArray(variants)) return variants
  if (variants?.nodes) {
    return flattenConnection({ nodes: variants.nodes })
  }
  if (variants?.edges) {
    return flattenConnection({ edges: variants.edges })
  }
  return []
}
