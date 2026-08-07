// src/app/produkter/[handle]/components/AsyncProductContent.tsx

import { notFound } from 'next/navigation'
import { ProductPageView } from './ProductPageView'
import { getCachedProductPageData } from '../utils/getCachedProductPageData'
import { reshapeProductWithMetafields } from '@/hooks/useProductWithMetafields'
import { resolveInitialVariant } from '../utils/resolveInitialVariant'
import { getProductWithoutSmallSize } from '@/components/products/getProductWithoutSmallSize'
import { buildProductPurchaseModel } from '@/lib/shopify/buildProductPurchaseModel'
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

  if (!initialVariant) {
    notFound()
  }

  const purchaseModel =
    buildProductPurchaseModel(displayProduct)

  const selectedPurchaseVariant =
    purchaseModel.variants.find(
      variant => variant.id === initialVariant.id
    )

  if (!selectedPurchaseVariant) {
    notFound()
  }

  return (
    <ProductPageView
      productData={purchaseModel}
      selectedVariant={selectedPurchaseVariant}
    />
  )
}