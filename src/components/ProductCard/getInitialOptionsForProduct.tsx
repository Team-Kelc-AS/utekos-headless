// Path: src/components/ProductCard/getInitialOptionsForProduct.tsx

import { getInitialAvailableOptions } from './getInitialAvailableOptions'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'
import { FORCED_COLORS } from '@/constants/forced-colors'

interface ProductContext {
  usedColors?: Set<string>
}
export function getInitialOptionsForProduct(
  product: ProductCardModel,
  context?: ProductContext
): Record<string, string> {
  const variants = product.variants?.edges
  if (!variants?.length) {
    return getInitialAvailableOptions(product)
  }

  const forcedColor = FORCED_COLORS[product.handle]
  const usedColors = context?.usedColors || new Set<string>()

  if (forcedColor && !usedColors.has(forcedColor)) {
    for (const edge of variants) {
      const variant = edge.node
      if (
        variant.availableForSale
        && variant.selectedOptions?.some(
          (opt: { name: string; value: string }) =>
            opt.name === 'Farge' && opt.value === forcedColor
        )
      ) {
        return Object.fromEntries(
          variant.selectedOptions.map(
            (opt: { name: string; value: string }) => [opt.name, opt.value]
          )
        )
      }
    }
  }

  for (const edge of variants) {
    const variant = edge.node
    if (variant.availableForSale && variant.selectedOptions?.length) {
      const colorOption = variant.selectedOptions.find(
        (opt: { name: string; value: string }) => opt.name === 'Farge'
      )

      if (!colorOption || !usedColors.has(colorOption.value)) {
        return Object.fromEntries(
          variant.selectedOptions.map(
            (opt: { name: string; value: string }) => [opt.name, opt.value]
          )
        )
      }
    }
  }

  return getInitialAvailableOptions(product)
}
