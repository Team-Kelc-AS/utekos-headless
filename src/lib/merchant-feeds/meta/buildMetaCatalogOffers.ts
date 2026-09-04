import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'
import { resolveCatalogVariantPresentation } from '@/lib/products/presentation'

import { buildMetaCatalogOffer } from './buildMetaCatalogOffer'
import { getMetaCatalogOfferDisposition } from './getMetaCatalogOfferDisposition'

export function buildMetaCatalogOffers(
  products: CatalogSyncProduct[]
) {
  return products.flatMap(product =>
    product.variants.edges.flatMap(({ node: variant }, index) => {
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

      if (disposition === 'excluded') return []

      return [
        buildMetaCatalogOffer({
          disposition,
          orderingIndex: index,
          product,
          publicVariant,
          variant
        })
      ]
    })
  )
}
