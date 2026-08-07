// src/app/produkter/[handle]/components/AsyncProductContent.tsx

import { notFound } from 'next/navigation'
import { ProductPageView } from './ProductPageView'
import { getCachedProductPageData } from '../utils/getCachedProductPageData'
import { reshapeProductWithMetafields } from '@/hooks/useProductWithMetafields'
import { resolveInitialVariant } from '../utils/resolveInitialVariant'
import { getProductWithoutSmallSize } from '@/components/products/getProductWithoutSmallSize'
import { fetchProductOptions } from '@/api/lib/products/fetchProductOptions'
import { buildProductPurchaseModel } from '@/lib/shopify/buildProductPurchaseModel'
import type { UtekosProductOptions } from '@/lib/shopify/product-options/types'
import type { SearchParamsPromise } from '../types'

type AsyncProductContentProps = {
  handle: string
  searchParams: SearchParamsPromise
}

export async function AsyncProductContent({
  handle,
  searchParams
}: AsyncProductContentProps) {
  const [{ product }, resolvedSearchParams] = await Promise.all([
    getCachedProductPageData(handle),
    searchParams
  ])

  if (!product) {
    notFound()
  }

  const productWithMetafields =
    reshapeProductWithMetafields(product) || product

  const displayProduct =
    productWithMetafields.handle === 'utekos-techdown' ?
      getProductWithoutSmallSize(productWithMetafields)
    : productWithMetafields

  const initialVariant = resolveInitialVariant(
    displayProduct,
    resolvedSearchParams
  )

  let mappedProductOptions: UtekosProductOptions | null = null
  let hasVariantSelectionError = false

  if (initialVariant) {
    try {
      mappedProductOptions = await fetchProductOptions({
        handle,
        selectedOptions: initialVariant.selectedOptions.map(
          ({ name, value }) => ({
            name,
            value
          })
        )
      })

      hasVariantSelectionError = mappedProductOptions === null
    } catch {
      hasVariantSelectionError = true
    }

    if (!mappedProductOptions) {
      mappedProductOptions = {
        selectedVariantId: initialVariant.id,
        selectedVariantAvailableForSale: false,
        options: []
      }
    }
  }

  if (!mappedProductOptions) {
    notFound()
  }

  const purchaseModel =
    buildProductPurchaseModel(displayProduct)

  const selectedPurchaseVariant =
    purchaseModel.variants.find(
      variant => variant.id === initialVariant?.id
    )

  if (!selectedPurchaseVariant) {
    notFound()
  }

  return (
    <ProductPageView
      productData={purchaseModel}
      selectedVariant={selectedPurchaseVariant}
      productOptions={mappedProductOptions}
      hasVariantSelectionError={hasVariantSelectionError}
    />
  )
}