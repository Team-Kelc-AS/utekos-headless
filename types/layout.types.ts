import type { Route } from 'next'
import type React from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'
import type { Image } from 'types/media/Image'
import type { RootNode } from '@types'
import type {
  ProductAccordionSection,
  ProductDescriptionContent
} from '@/db/data/products/product-page-content'
import type { UtekosProductOptionValue } from '@/lib/shopify/product-options/types'
export type OptionButtonProps = {
  isSelected: boolean
  isAvailable?: boolean
  disabled?: boolean
  ariaLabel?: string
  optionName?: string
  optionValue?: string
  onClick: () => void
  children: ReactNode
}

export type AdditionalLine = {
  variantId: string
  quantity: number
}

export type TechDownLaunchOfferProps = {
  onAdditionalLineChange: (
    line: AdditionalLine | undefined
  ) => void
}

export type PriceActivityPanelProps = {
  productHandle: string
  priceAmount: string
  currencyCode: string
  limitedStockCount?: number
  activityNode?: React.ReactNode
}

export type ProductPageAccordionProps = {
  sections: ProductAccordionSection[] | undefined
}

export type ProductControllerProps = {
  productData: ShopifyProduct
  relatedProducts: ShopifyProduct[]
}

export type AccordionSectionData = {
  id: ProductAccordionSection['id']
  title: string
  content: ProductAccordionSection
  Icon: LucideIcon
  color: string
}

export type ProductGalleryProps = {
  title: string
  images: Image[]
  imageBackgroundClassName?: string
  imageClassName?: string
}
export type QuantitySelectorProps = {
  value: number
  onChange: (value: number) => void
}

export type SizeSelectorProps = {
  optionName: string
  values: string[]
  variants: ShopifyProductVariant[]
  selectedVariant: ShopifyProductVariant
  onSelect: (_optionName: string, _value: string) => void
  productHandle: string
  optionValues: UtekosProductOptionValue[]
  isSelectionDisabled: boolean
}
export type Dimension = { value: number; unit: string } | null

export type ColorSelectorProps = {
  optionName: string
  values: string[]
  variants: ShopifyProductVariant[]
  colorHexMap: Map<string, string>
  selectedVariant: ShopifyProductVariant
  onSelect: (optionName: string, value: string) => void
  optionValues: UtekosProductOptionValue[]
  isSelectionDisabled: boolean
}

export type SmartRealTimeActivityProps = { baseViewers: number }
export type Section = {
  id: string
  title: string
  content: React.ReactNode
}

export type ProductDescriptionProps = {
  description: ProductDescriptionContent | undefined
}

export type ProductCarouselProps = { products: ShopifyProduct[] }

export type SizeLabelProps = { className?: string }

export type ProductCardProps = {
  product: ShopifyProduct
  preferredColor?: string
  colorHexMap: Map<string, string>
  itemListId?: string
}
export type RichTextRendererProps = { content: RootNode | null }

export type ProductVariantSelectorProps = {
  options: ShopifyProduct['options']
  selectedOptions: Record<string, string>
  onOptionChange: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >
  colorHexMap: Map<string, string>
}

export type ProductCardFooterProps = {
  isAvailable: boolean
  isPending: boolean
  onQuickBuy: (e: React.MouseEvent) => void
}

export type ProductCardHeaderProps = {
  title: string
  options: ShopifyProduct['options']
  colorHexMap: Map<string, string>
  selectedOptions: Record<string, string>
  onOptionChange: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >
  price: string
  productUrl: Route
  onViewProduct?: () => void
}

export type SpecialOfferCrossSellProps = {
  currentProductHandle: string
}

export type GridCrossProps = { className?: string }
