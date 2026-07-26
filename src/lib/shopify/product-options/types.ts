export type UtekosProductOptionValue = {
  name: string
  variantId: string | null
  variantHref: string | null
  variantAvailableForSale: boolean
  selected: boolean
  exists: boolean
  available: boolean
  isDifferentProduct: boolean
}

export type UtekosProductOption = {
  name: string
  optionValues: UtekosProductOptionValue[]
}

export type UtekosProductOptions = {
  selectedVariantId: string
  selectedVariantAvailableForSale: boolean
  options: UtekosProductOption[]
}
