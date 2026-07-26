import { getProductOptions } from '@shopify/hydrogen-react'
import type { StorefrontProductOptions } from '@/api/shopify/types/storefrontProductOptions'
import type { UtekosProductOptions } from './types'

function createVariantHref(
  handle: string,
  variantId: string
): string {
  return `/produkter/${encodeURIComponent(handle)}?variant=${encodeURIComponent(variantId)}`
}

export function createUtekosProductOptions(
  product: StorefrontProductOptions
): UtekosProductOptions {
  const options = getProductOptions(product).map(option => ({
    name: option.name,
    optionValues: option.optionValues.map(value => {
      const variantId = value.variant?.id ?? null

      return {
        name: value.name,
        variantId,
        variantHref:
          variantId ?
            createVariantHref(value.handle, variantId)
          : null,
        variantAvailableForSale:
          value.variant?.availableForSale ?? false,
        selected: value.selected,
        exists: value.exists,
        available: value.available,
        isDifferentProduct: value.isDifferentProduct
      }
    })
  }))

  return {
    selectedVariantId:
      product.selectedOrFirstAvailableVariant.id,
    selectedVariantAvailableForSale:
      product.selectedOrFirstAvailableVariant.availableForSale,
    options
  }
}
