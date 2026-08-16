// Path: src/components/ProductCard/findMatchingVariant.ts

import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'
import type { ProductCardProps } from '@types'

export function findMatchingVariant(
  product: ProductCardProps['product'],
  selectedOptions: Record<string, string>
): ProductPurchaseVariant | undefined {
  if (!product.variants.edges?.length) return undefined

  // Hoist selectedOptions key count outside the iteration loop to avoid redundant
  // Object.keys() allocations on every variant comparison during UI option selection.
  const targetOptionsCount = Object.keys(selectedOptions).length

  return product.variants.edges.find(edge => {
    const variant = edge.node
    if (variant.selectedOptions.length !== targetOptionsCount) return false

    return variant.selectedOptions.every(
      option => selectedOptions[option.name] === option.value
    )
  })?.node
}
