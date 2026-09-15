import { notFound } from 'next/navigation'
import { ProductPageView } from './ProductPageView'
import { getCachedProductPageData } from '../utils/getCachedProductPageData'
import { reshapeProductWithMetafields } from '@/hooks/useProductWithMetafields'
import {
  buildProductModel,
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
  const commerce = buildProductModel(productWithMetafields, {
    includeVariantProfiles: true
  })
  const selectedCommerceVariant =
    resolveCommerceVariantFromSearchParams(
      commerce,
      resolvedSearchParams
    )

  if (!selectedCommerceVariant) {
    notFound()
  }

  const selectedStorefrontVariant =
    productWithMetafields.variants.edges.find(
      ({ node }) => node.id === selectedCommerceVariant.id
    )?.node

  if (!selectedStorefrontVariant) {
    notFound()
  }

  return (
    <ProductPageView
      productData={commerce}
      selectedVariant={selectedCommerceVariant}
      storefrontLookupHandle={presentation.publicHandle}
      storefrontSelectedOptions={
        selectedStorefrontVariant.selectedOptions
      }
    />
  )
}
