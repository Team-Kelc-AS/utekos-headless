'use client'

import { reportCanonicalSelectItem } from './selectItemReporter'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type ReportProductListSelectItemInput = {
  destinationUrl: string
  itemListId: string
  product: ProductCommerceModel
  variant: ProductPurchaseVariant | null | undefined
}

export function reportProductListSelectItem(
  input: ReportProductListSelectItemInput
): void {
  if (!input.variant) return

  try {
    reportCanonicalSelectItem({
      product: input.product,
      variant: input.variant,
      itemListId: input.itemListId,
      destinationUrl: input.destinationUrl
    })
  } catch {
    // Fail-open for navigation; reporter already rethrows async
  }
}
