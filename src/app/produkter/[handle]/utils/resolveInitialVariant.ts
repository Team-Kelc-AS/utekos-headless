// Path: src/app/produkter/[handle]/utils/resolveInitialVariant.ts
import { flattenConnection } from '@shopify/hydrogen-react'
import { findVariantFromReadableParams } from './findVariantFromReadableParams'
import { toURLSearchParams } from './toURLSearchParams'
import { getFirstSearchParamValue } from './getFirstSearchParamValue'
import type { SearchParamsRecord } from '../types'
import type { ShopifyProduct } from 'types/product'

export function resolveInitialVariant(product: ShopifyProduct, searchParams: SearchParamsRecord) {
  const allVariants = flattenConnection(product.variants)
  if (!allVariants.length) return null

  const variantId = getFirstSearchParamValue(searchParams.variant)
  if (variantId) {
    const variantFromId = allVariants.find(variant => variant.id === variantId)
    if (variantFromId) return variantFromId
  }

  const readableParams = toURLSearchParams(searchParams)
  const variantFromReadableParams = findVariantFromReadableParams(allVariants, readableParams)

  if (variantFromReadableParams) return variantFromReadableParams

  return (
    allVariants.find(variant => variant.availableForSale)
    ?? product.selectedOrFirstAvailableVariant
    ?? allVariants[0]
    ?? null
  )
}
