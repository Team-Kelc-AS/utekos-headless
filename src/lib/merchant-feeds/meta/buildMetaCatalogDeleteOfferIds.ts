import { resolveMetaCatalogProductId } from '@/lib/analytics/metaCatalogIdentity'
import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'
import { resolveCatalogVariantPresentation } from '@/lib/products/presentation'

import { getMetaCatalogOfferDisposition } from './getMetaCatalogOfferDisposition'

export function buildMetaCatalogDeleteOfferIds(
  products: CatalogSyncProduct[]
) {
  return products.flatMap(product =>
    product.variants.edges.flatMap(({ node: variant }) => {
      const publicVariant = resolveCatalogVariantPresentation({
        handle: product.handle,
        selectedOptions: variant.selectedOptions
      })

      if (publicVariant.status !== 'included') return []

      const disposition = getMetaCatalogOfferDisposition({
        product,
        publicOptions: publicVariant.options,
        variant
      })

      return disposition === 'delete' ?
          [resolveMetaCatalogProductId(variant.id)]
        : []
    })
  )
}
