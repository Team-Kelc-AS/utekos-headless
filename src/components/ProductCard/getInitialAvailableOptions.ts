// Path: src/components/ProductCard/getInitialAvailableOptions.ts

import type { ProductCardModel } from 'types/product/ProductPurchaseModel'
import { buildFallbackOptions } from './buildFallbackOptions'
export function getInitialAvailableOptions(
  product: ProductCardModel
): Record<string, string> {
  const variants = product.variants?.edges
  if (!variants?.length) {
    return buildFallbackOptions(product.options)
  }

  for (const edge of variants) {
    const variant = edge.node
    if (variant.availableForSale && variant.selectedOptions?.length) {
      return Object.fromEntries(
        variant.selectedOptions.map(opt => [opt.name, opt.value])
      )
    }
  }

  return buildFallbackOptions(product.options)
}
