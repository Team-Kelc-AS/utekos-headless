'use client'

import { useEffect, useRef } from 'react'
import { useLandingPurchaseLogic } from './useLandingPurchaseLogic.'
import { PurchaseClientViewLanding } from './PurchaseClientViewLanding'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

export function PurchaseClientLanding({
  commerce,
  initialVariantId
}: {
  commerce: ProductCommerceViewModel
  initialVariantId: string
}) {
  const logic = useLandingPurchaseLogic({
    commerce,
    initialVariantId
  })
  const reportedViewItemKey = useRef<string | null>(null)
  const { shopifyProduct, selectedShopifyVariant } = logic

  useEffect(() => {
    if (!shopifyProduct || !selectedShopifyVariant) {
      return
    }

    const reportKey = createViewItemReportKey(
      shopifyProduct.id,
      selectedShopifyVariant.id
    )

    if (reportedViewItemKey.current === reportKey) return

    return reportCanonicalViewItem({
      product: shopifyProduct,
      variant: selectedShopifyVariant,
      onEmitted: () => {
        reportedViewItemKey.current = reportKey
      }
    })
  }, [shopifyProduct, selectedShopifyVariant])

  return <PurchaseClientViewLanding {...logic} />
}
