'use client'

import { useQuery } from '@tanstack/react-query'
import { productOptions } from '@/api/lib/products/productOptions'
import { reshapeProductWithMetafields } from '@/hooks/useProductWithMetafields'
import { createSwatchColorMap } from '@/hooks/createSwatchColorMap'
import { getProductWithoutSmallSize } from '@/components/products/getProductWithoutSmallSize'
import type { ShopifyProduct } from 'types/product'

export function useProductPageData(
  handle: string,
  initialRelatedProducts: ShopifyProduct[]
) {
  const {
    data: productData,
    error: productError,
    isFetching,
    isLoading,
    refetch
  } = useQuery(productOptions(handle))

  const productWithMetafields =
    reshapeProductWithMetafields(productData)
  const displayProduct =
    productWithMetafields?.handle === 'utekos-techdown' ?
      getProductWithoutSmallSize(productWithMetafields)
    : productWithMetafields

  return {
    productData: displayProduct,
    relatedProducts: initialRelatedProducts,
    swatchColorMap: createSwatchColorMap(displayProduct),
    productError,
    refetch,
    isFetching,
    isLoading
  }
}
