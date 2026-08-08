// Path: types/product.types.ts

import type { StaticImageData } from 'next/image'
import type { MetaobjectReference } from './MetaobjectReference'
import type { ShopifyProduct } from './ShopifyProduct'
import type { ProductCardModel } from './ProductPurchaseModel'
import type { ShopifyProductVariant } from './ShopifyProductVariant'

export type RelatedProductsProps = {
  products: ProductCardModel[]
}

export type WeightUnit = {
  unit: string
  value: number
}
export type ShopifySelectedOption = {
  name: string
  value: string
}

export type ProductOption = {
  name: string
  optionValues: {
    name: string
  }[]
}

export type SelectedOption = {
  name: string
  value: string
}
export type VariantProfileReference = {
  reference: MetaobjectReference | null
}

export type ProductVariantEdge = {
  node: ShopifyProductVariant
}

export type ProductVariantConnection = {
  edges: ProductVariantEdge[]
}

export type ColorVariant = {
  name: string
  hex: string
}

export type ProductHighlight = {
  title: string
  body: string
}

export type ProductConfig = {
  id: string
  title: string
  subtitle: string
  price: number
  badge: string
  description: string
  highlights: ProductHighlight[]
  images: string[]
  colors: ColorVariant[]
  sizes: string[]
  features: string[]
}

export type MicrofiberColor = 'fjellbla' | 'vargnatt'

export type MicrofiberSize = 'medium' | 'large'

export type MicrofiberLogicProps = {
  color: MicrofiberColor
  setColor: (color: MicrofiberColor) => void
  size: MicrofiberSize
  setSize: (size: MicrofiberSize) => void
  activeImage: string | StaticImageData | undefined
  product: ShopifyProduct | null
  selectedVariant: ShopifyProductVariant | null
  handleAddToCart: () => void
  scrollToSizeGuide: () => void
  isPending: boolean
  isDisabled: boolean
}
