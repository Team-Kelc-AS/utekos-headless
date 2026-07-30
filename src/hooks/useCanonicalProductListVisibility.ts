'use client'

import { registerCanonicalProductListVisibility } from '@/lib/analytics/productListVisibilityTracker'
import { useEffect, type RefObject } from 'react'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type UseCanonicalProductListVisibilityInput = {
  elementRef: RefObject<Element | null>
  closestSelector?: string
  itemListId: string
  itemListName: string
  product: ProductCommerceModel
  totalItemCount: number
  variant: ProductPurchaseVariant | null | undefined
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
