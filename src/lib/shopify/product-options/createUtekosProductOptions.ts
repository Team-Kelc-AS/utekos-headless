import { getProductOptions } from '@shopify/hydrogen-react'
import {
  buildPublicVariantUrl,
  requireProductPresentation,
  resolvePublicOptionValue,
  resolvePublicVariantOptions
} from '@/lib/products/presentation'
import type { StorefrontProductOptions } from '@/api/shopify/types/storefrontProductOptions'
import type { UtekosProductOptions } from './types'

export function createUtekosProductOptions(
  product: StorefrontProductOptions
): UtekosProductOptions {
  const presentation = requireProductPresentation(product.handle)
  const variantsById = new Map(
    [
      product.selectedOrFirstAvailableVariant,
      ...product.adjacentVariants
    ].map(variant => [variant.id, variant])
  )
  const options = getProductOptions(product).map(option => {
    const firstMappedValue = option.optionValues
      .map(value =>
        resolvePublicOptionValue(
          presentation,
          option.name,
          value.name
        )
      )
      .find(Boolean)

    if (!firstMappedValue) {
      throw new Error(
        `Missing public option mapping for ${product.handle}: ${option.name}`
      )
    }

    return {
      name: firstMappedValue.publicName,
      optionValues: option.optionValues.map(value => {
        const variantId = value.variant?.id ?? null
        const mappedValue = resolvePublicOptionValue(
          presentation,
          option.name,
          value.name
        )

        if (!mappedValue) {
          throw new Error(
            `Missing public option value for ${product.handle}: ${option.name}=${value.name}`
          )
        }

        const variant = variantId ? variantsById.get(variantId) : null
        const publicOptions = variant ?
            resolvePublicVariantOptions(
              presentation,
              variant.selectedOptions
            )
          : null

        return {
          name: mappedValue.publicValue,
          variantId,
          variantHref:
            publicOptions ?
              buildPublicVariantUrl({
                presentation,
                options: publicOptions
              })
            : null,
          variantAvailableForSale:
            value.variant?.availableForSale ?? false,
          selected: value.selected,
          exists: value.exists,
          available: value.available,
          isDifferentProduct: value.isDifferentProduct
        }
      })
    }
  })

  return {
    selectedVariantId:
      product.selectedOrFirstAvailableVariant.id,
    selectedVariantAvailableForSale:
      product.selectedOrFirstAvailableVariant.availableForSale,
    options
  }
}
