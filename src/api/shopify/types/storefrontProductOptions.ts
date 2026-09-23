import type {
  Collection,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  SelectedOptionInput
} from '@shopify/hydrogen-react/storefront-api-types'

type ProductOptionMoney = { amount: string; currencyCode: 'NOK' }

export type StorefrontProductOptionVariant = Pick<
  ProductVariant,
  'id' | 'availableForSale' | 'selectedOptions'
> & {
  product: Pick<Product, 'handle'>
  title: string
  barcode: string | null
  currentlyNotInStock: boolean
  taxable: boolean
  quantityAvailable: number | null
  sku: string | null
  price: ProductOptionMoney
  compareAtPrice: ProductOptionMoney | null
}

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
  'id' | 'title' | 'handle' | 'productType' | 'vendor'
> & {
  collections: { nodes: Array<Pick<Collection, 'id' | 'title'>> }
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
