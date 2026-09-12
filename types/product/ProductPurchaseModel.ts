import type { Money } from 'types/commerce/Money'
import type { Image } from 'types/media'
import type { z } from 'zod'
import type {
  productIdentitySchema,
  productPurchaseSchema,
  purchaseVariantSchema
} from '@/lib/products/productModelSchema'
import type { ProductOption } from './ProductTypes'

export type ProductCommerceModel = z.infer<
  typeof productIdentitySchema
>

export type ProductPurchaseVariant = z.infer<
  typeof purchaseVariantSchema
>

export type ProductCartModel = ProductCommerceModel & {
  featuredImage: Image | null
}

export type ProductCardModel = ProductCartModel & {
  priceRange: { minVariantPrice: Money }
  options: ProductOption[]
  variants: { edges: Array<{ node: ProductPurchaseVariant }> }
}

/**
 * The explicit, public DTO allowed to cross the PDP Server Component boundary.
 * Shopify connections, metafield references, SEO, ranges and unrelated product
 * fields intentionally stay on the server.
 */
export type ProductPurchaseModel = z.infer<
  typeof productPurchaseSchema
>
