// Path: src/components/ProductCard/findMatchingVariant.ts

import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'
import type { ProductCardProps } from '@types'

export function findMatchingVariant(
  product: ProductCardProps['product'],
  selectedOptions: Record<string, string>
): ProductPurchaseVariant | undefined {
  if (!product.variants.edges?.length) return undefined

  return product.variants.edges.find(edge => {
    const variant = edge.node
    const variantOptionsCount = Object.keys(selectedOptions).length
    if (variant.selectedOptions.length !== variantOptionsCount) return false

    return variant.selectedOptions.every(
      option => selectedOptions[option.name] === option.value
    )
  })?.node
}
