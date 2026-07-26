'use client'

import { registerCanonicalProductListVisibility } from '@/lib/analytics/productListVisibilityTracker'
import { useEffect, type RefObject } from 'react'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

type UseCanonicalProductListVisibilityInput = {
  elementRef: RefObject<Element | null>
  closestSelector?: string
  itemListId: string
  itemListName: string
  product: ShopifyProduct
  totalItemCount: number
  variant: ShopifyProductVariant | null | undefined
}

export function useCanonicalProductListVisibility(
  input: UseCanonicalProductListVisibilityInput
) {
  useEffect(() => {
    const baseElement = input.elementRef.current
    const element =
      input.closestSelector ?
        baseElement?.closest(input.closestSelector)
      : baseElement
    if (!element || !input.variant) return

    return registerCanonicalProductListVisibility({
      element,
      itemListId: input.itemListId,
      itemListName: input.itemListName,
      product: input.product,
      totalItemCount: input.totalItemCount,
      variant: input.variant
    })
  }, [
    input.elementRef,
    input.closestSelector,
    input.itemListId,
    input.itemListName,
    input.product,
    input.totalItemCount,
    input.variant
  ])
}
