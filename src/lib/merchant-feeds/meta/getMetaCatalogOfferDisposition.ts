import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import type { PublicVariantOptions } from '@/lib/products/presentation/resolvePublicVariantOptions'

import type { MetaCatalogOfferDisposition } from './metaCatalogOffer'

const META_CATALOG_PRODUCT_HANDLES = new Set([
  'comfyrobe',
  'utekos-dun',
  'utekos-mikrofiber',
  'utekos-stapper',
  'utekos-techdown'
])

export function getMetaCatalogOfferDisposition(input: {
  product: CatalogSyncProduct
  publicOptions: PublicVariantOptions
  variant: CatalogSyncVariant
}): MetaCatalogOfferDisposition {
  const { product, publicOptions, variant } = input

  if (
    product.status !== 'ACTIVE' ||
    !META_CATALOG_PRODUCT_HANDLES.has(product.handle)
  ) {
    return 'excluded'
  }

  if (
    product.handle === 'utekos-dun' ||
    product.handle === 'utekos-stapper'
  ) {
    return 'delete'
  }

  if (
    product.handle === 'utekos-mikrofiber' &&
    publicOptions.color !== 'Fjellblå'
  ) {
    return 'delete'
  }

  if (
    product.handle === 'comfyrobe' &&
    publicOptions.size === 'M'
  ) {
    return 'excluded'
  }

  return variant.availableForSale &&
    variant.inventoryQuantity !== null &&
    variant.inventoryQuantity > 0 ?
      'published'
    : 'delete'
}
