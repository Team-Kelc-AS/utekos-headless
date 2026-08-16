import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { resolveCatalogVariantPresentation } from '@/lib/products/presentation'

const EXCLUDED_PRODUCT_HANDLES = new Set([
  'utekos-buff',
  'utekos-dun'
])

const INCLUDED_COLOR_BY_HANDLE: Record<string, string> = {
  'comfyrobe': 'fjellnatt',
  'utekos-mikrofiber': 'fjellblå',
  'utekos-stapper': 'vargnatt',
  'utekos-techdown': 'havdyp'
}

export function isPinterestCatalogOfferIncluded(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
) {
  const handle = product.handle.trim().toLowerCase()
  const publicVariant = resolveCatalogVariantPresentation({
    handle,
    selectedOptions: variant.selectedOptions
  })

  if (publicVariant.status !== 'included') {
    return false
  }

  if (EXCLUDED_PRODUCT_HANDLES.has(handle)) {
    return false
  }

  const includedColor = INCLUDED_COLOR_BY_HANDLE[handle]

  if (!includedColor) {
    return false
  }

  const color =
    publicVariant.options.color?.trim().toLowerCase() ?? ''

  if (color !== includedColor) {
    return false
  }

  if (
    handle === 'utekos-techdown' &&
    publicVariant.options.size === 'Liten'
  ) {
    return false
  }

  return true
}
