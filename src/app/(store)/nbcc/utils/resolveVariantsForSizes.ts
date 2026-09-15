import type { ShopifyProductVariant } from 'types/product'

import type { NbccProductVariant } from '../types'
import { formatPrice } from '@/lib/utils/formatPrice'
import { normalizeVariantOption } from './normalizeVariantOption'
import { toNbccPurchaseVariant } from './toNbccCartProduct'

export function resolveVariantsForSizes(
  allVariants: ShopifyProductVariant[],
  sizes: string[],
  color?: string
): NbccProductVariant[] {
  return sizes.flatMap(label => {
    const normalizedLabel = normalizeVariantOption(label)

    const variant = allVariants.find(candidate => {
      const hasSize = candidate.selectedOptions.some(
        option =>
          normalizeVariantOption(option.value) === normalizedLabel
      )

      if (!hasSize) return false

      if (color) {
        const normalizedColor = normalizeVariantOption(color)

        return candidate.selectedOptions.some(
          option =>
            normalizeVariantOption(option.value) ===
            normalizedColor
        )
      }

      return true
    })

    if (!variant) return []

    return [
      {
        label,
        variantId: variant.id,
        availableForSale: variant.availableForSale,
        price: formatPrice(variant.price),
        purchaseVariant: toNbccPurchaseVariant(variant)
      }
    ]
  })
}
