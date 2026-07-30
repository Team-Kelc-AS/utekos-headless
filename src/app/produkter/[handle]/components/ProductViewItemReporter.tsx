'use client'

import { useEffect, useRef } from 'react'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type ProductViewItemReporterProps = {
  product: ProductCommerceModel
  variant: ProductPurchaseVariant
}

export function ProductViewItemReporter({
  product,
  variant
}: ProductViewItemReporterProps) {
  const reportedKey = useRef<string | null>(null)

  useEffect(() => {
    const reportKey = createViewItemReportKey(
      product.id,
      variant.id
    )

    if (reportedKey.current === reportKey) return

    return reportCanonicalViewItem({
      product,
      variant,
      onEmitted: () => {
        reportedKey.current = reportKey
      }
    })
  }, [product, variant])

  return null
}
