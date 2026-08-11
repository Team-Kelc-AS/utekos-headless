import { notFound } from 'next/navigation'
import { ProductPageView } from './ProductPageView'
import { getCachedProductPageData } from '../utils/getCachedProductPageData'
import { reshapeProductWithMetafields } from '@/hooks/useProductWithMetafields'
import {
  buildPresentedProductPurchaseModel,
  buildProductCommerceViewModel,
  resolveCommerceVariantFromSearchParams
} from '@/lib/products/commerce'
import { getProductPresentation } from '@/lib/products/presentation'
import type { SearchParamsPromise } from '../types'

type AsyncProductContentProps = {
  handle: string
  searchParams: SearchParamsPromise
}

export async function AsyncProductContent({
  handle,
  searchParams
}: AsyncProductContentProps) {
  const presentation = getProductPresentation(handle)

  if (!presentation) {
    notFound()
  }

  const [{ product }, resolvedSearchParams] = await Promise.all([
    getCachedProductPageData(presentation.publicHandle),
    searchParams
  ])

  if (!product) {
    notFound()
  }

  const productWithMetafields =
    reshapeProductWithMetafields(product) || product
  const commerce = buildProductCommerceViewModel(
    productWithMetafields,
    presentation.publicHandle
  )
  const selectedCommerceVariant =
    resolveCommerceVariantFromSearchParams(
      commerce,
      resolvedSearchParams
    )

  if (!selectedCommerceVariant) {
    notFound()
  }

  const purchaseModel = buildPresentedProductPurchaseModel(
    productWithMetafields,
    presentation.publicHandle
  )
  const selectedPurchaseVariant = purchaseModel.variants.find(
    variant => variant.id === selectedCommerceVariant.commerce.id
  )
  const selectedStorefrontVariant =
    productWithMetafields.variants.edges.find(
      ({ node }) =>
        node.id === selectedCommerceVariant.commerce.id
    )?.node

  if (!selectedPurchaseVariant || !selectedStorefrontVariant) {
    notFound()
  }

  return (
    <ProductPageView
      productData={purchaseModel}
      selectedVariant={selectedPurchaseVariant}
      storefrontLookupHandle={
        presentation.storefrontLookupHandle
      }
      storefrontSelectedOptions={
        selectedStorefrontVariant.selectedOptions
      }
    />
  )
}
