import type {
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  SelectedOptionInput
} from '@shopify/hydrogen-react/storefront-api-types'

export type StorefrontProductOptionVariant = Pick<
  ProductVariant,
  'id' | 'availableForSale' | 'selectedOptions'
> & { product: Pick<Product, 'handle'> }

type StorefrontProductOptionValue = Pick<
  ProductOptionValue,
  'name'
> & {
  firstSelectableVariant: StorefrontProductOptionVariant | null
}

type StorefrontProductOption = Pick<ProductOption, 'name'> & {
  optionValues: StorefrontProductOptionValue[]
}

export type StorefrontProductOptions = Pick<
  Product,
  'handle'
> & {
  encodedVariantExistence: string
  encodedVariantAvailability: string
  options: StorefrontProductOption[]
  selectedOrFirstAvailableVariant: StorefrontProductOptionVariant
  adjacentVariants: StorefrontProductOptionVariant[]
}

export type StorefrontProductOptionsVariables = {
  handle: string
  selectedOptions: SelectedOptionInput[]
}
