// Path: src/hooks/useProductPage.ts

'use client'

import { useProductPageData } from '@/hooks/useProductPageData'
import { useVariantSelection } from '@/hooks/useVariantSelection'
import { computeVariantImages } from '@/lib/utils/computeVariantImages'
import type { UtekosProductOptions } from '@/lib/shopify/product-options/types'
import type { ShopifyProduct } from 'types/product'

export function useProductPage(
  handle: string,
  initialRelatedProducts: ShopifyProduct[],
  productOptions: UtekosProductOptions
) {
  const productPageData = useProductPageData(
    handle,
    initialRelatedProducts
  )
  const {
    allVariants,
    selectedVariant,
    updateVariant,
    isVariantNavigationPending
  } = useVariantSelection({
    product: productPageData.productData,
    productOptions
  })

  return {
    ...productPageData,
    selectedVariant,
    allVariants,
    variantImages:
      productPageData.productData ?
        computeVariantImages(
          productPageData.productData,
          selectedVariant
        )
      : [],
    updateVariant,
    isVariantNavigationPending
  }
}
