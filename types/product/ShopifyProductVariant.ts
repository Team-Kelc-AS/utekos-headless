import type { ProductPurchaseVariant } from './ProductPurchaseModel'
// Path: types/product/ShopifyProductVariant.ts

import type { Metafield } from './MetaField'
import type { ShopifyProduct } from './ShopifyProduct'
import type { VariantProfileReference } from 'types/product/ProductTypes'

export type ShopifyProductVariant = ProductPurchaseVariant & {
  product?: ShopifyProduct
  metafield: Metafield | null
  variantProfile: VariantProfileReference | null
  weight: number | null
  weightUnit: string
}
