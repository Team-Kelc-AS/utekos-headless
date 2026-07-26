'use client'

import { useEffect, useRef } from 'react'
import { ProductPageView } from './ProductPageView'
import { ProductPageSkeleton } from './ProductPageSkeleton'
import { ProductPageErrorState } from './ProductPageErrorState'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import type { UtekosProductOptions } from '@/lib/shopify/product-options/types'
import type { Image } from 'types/media'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'

type ProductPageControllerViewProps = {
  productData: ShopifyProduct | undefined
  selectedVariant: ShopifyProductVariant | null
  allVariants: ShopifyProductVariant[]
  variantImages: Image[]
  updateVariant: (_optionName: string, _value: string) => void
  relatedProducts: ShopifyProduct[]
  swatchColorMap: Map<string, string>
  productError: Error | null
  refetch: () => unknown
  isFetching: boolean
  isLoading: boolean
  productOptions: UtekosProductOptions
  isVariantNavigationPending: boolean
  hasVariantSelectionError: boolean
}

export function ProductPageControllerView({
  productData,
  selectedVariant,
  allVariants,
  variantImages,
  updateVariant,
  relatedProducts,
  swatchColorMap,
  productError,
  refetch,
  isFetching,
  isLoading,
  productOptions,
  isVariantNavigationPending,
  hasVariantSelectionError
}: ProductPageControllerViewProps) {
  const reportedViewItemKey = useRef<string | null>(null)

  useEffect(() => {
    if (!productData || !selectedVariant) {
      return
    }

    const reportKey = createViewItemReportKey(
      productData.id,
      selectedVariant.id
    )

    if (reportedViewItemKey.current === reportKey) return

    return reportCanonicalViewItem({
      product: productData,
      variant: selectedVariant,
      onEmitted: () => {
        reportedViewItemKey.current = reportKey
      }
    })
  }, [productData, selectedVariant])

  if (productError && !productData) {
    return (
      <ProductPageErrorState
        error={productError}
        isRetrying={isFetching}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  if (
    (isLoading && !productData) ||
    !productData ||
    !selectedVariant
  ) {
    return <ProductPageSkeleton />
  }

  return (
    <ProductPageView
      productData={productData}
      selectedVariant={selectedVariant}
      allVariants={allVariants}
      variantImages={variantImages}
      onOptionChange={updateVariant}
      relatedProducts={relatedProducts}
      colorHexMap={swatchColorMap}
      productOptions={productOptions}
      isVariantNavigationPending={isVariantNavigationPending}
      hasVariantSelectionError={hasVariantSelectionError}
    />
  )
}
