// Path: types/product/ShopifyProductVariant.ts

import type { Metafield } from './MetaField'
import type { ShopifyProduct } from './ShopifyProduct'
import type { VariantProfileReference } from 'types/product/ProductTypes'
import type { Money } from 'types/commerce/Money'
import type { Image } from 'types/media'
import type { SelectedOption } from './ProductTypes'
import type { MetaobjectReference } from './MetaobjectReference'

export type ShopifyProductVariant = {
  id: string
  title: string
  barcode: string | null
  availableForSale: boolean
  currentlyNotInStock: boolean
  taxable: boolean
  selectedOptions: SelectedOption[]
  price: Money
  image: Image | null
  compareAtPrice: Money | null
  product?: ShopifyProduct
  metafield: Metafield | null
  sku: string | undefined
  variantProfile: VariantProfileReference | null
  variantProfileData?: Partial<MetaobjectReference>
  weight: number | null
  weightUnit: string
  quantityAvailable: number | null
}
