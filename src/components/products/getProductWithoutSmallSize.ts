import type { ShopifyProduct } from 'types/product'

const HIDDEN_SIZE_VALUE = 'Liten'
const PREFERRED_SIZE_VALUE = 'Stor'

function isSizeOption(optionName: string): boolean {
  const normalizedOptionName = optionName.toLowerCase()
  return (
    normalizedOptionName === 'størrelse' ||
    normalizedOptionName === 'size'
  )
}

function isHiddenSmallSizeOption(option: {
  name: string
  value: string
}): boolean {
  return (
    isSizeOption(option.name) && option.value === HIDDEN_SIZE_VALUE
  )
}

function isPreferredSizeOption(option: {
  name: string
  value: string
}): boolean {
  return (
    isSizeOption(option.name) &&
    option.value === PREFERRED_SIZE_VALUE
  )
}

export function getProductWithoutSmallSize(
  product: ShopifyProduct
): ShopifyProduct {
  const visibleVariantEdges = product.variants.edges.filter(
    edge =>
      !edge.node.selectedOptions.some(isHiddenSmallSizeOption)
  )

  const preferredVariantEdges = visibleVariantEdges.filter(
    edge => edge.node.selectedOptions.some(isPreferredSizeOption)
  )

  const selectedOrFirstAvailableVariant =
    preferredVariantEdges.find(edge => edge.node.availableForSale)
      ?.node ??
    preferredVariantEdges[0]?.node ??
    visibleVariantEdges.find(edge => edge.node.availableForSale)
      ?.node ??
    visibleVariantEdges[0]?.node ??
    product.selectedOrFirstAvailableVariant

  return {
    ...product,
    ...(selectedOrFirstAvailableVariant ?
      { selectedOrFirstAvailableVariant }
    : {}),
    options: product.options.map(option => {
      if (!isSizeOption(option.name)) return option

      return {
        ...option,
        optionValues: option.optionValues.filter(
          value => value.name !== HIDDEN_SIZE_VALUE
        )
      }
    }),
    variants: {
      ...product.variants,
      edges: visibleVariantEdges
    }
  }
}
