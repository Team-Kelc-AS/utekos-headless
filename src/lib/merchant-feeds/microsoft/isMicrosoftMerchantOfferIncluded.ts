import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'

const EXCLUDED_PRODUCT_HANDLES = new Set([
  'utekos-buff',
  'utekos-dun',
  'utekos-stapper'
])

const MICROFIBER_HANDLE = 'utekos-mikrofiber'
const MICROFIBER_INCLUDED_COLOR = 'fjellblå'

function getNormalizedColor(variant: CatalogSyncVariant) {
  return (
    variant.selectedOptions.find(option =>
      ['color', 'farge'].includes(option.name.trim().toLowerCase())
    )?.value ?? ''
  )
    .trim()
    .toLowerCase()
}

export function isMicrosoftMerchantOfferIncluded(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
) {
  const handle = product.handle.trim().toLowerCase()

  if (EXCLUDED_PRODUCT_HANDLES.has(handle)) {
    return false
  }

  if (handle === MICROFIBER_HANDLE) {
    return getNormalizedColor(variant) === MICROFIBER_INCLUDED_COLOR
  }

  return true
}
