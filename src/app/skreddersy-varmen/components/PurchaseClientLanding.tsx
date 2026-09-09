'use client'

import { useEffect, useRef } from 'react'
import { useLandingPurchaseLogic } from './useLandingPurchaseLogic.'
import { PurchaseClientViewLanding } from './PurchaseClientViewLanding'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'
import type { LandingPurchaseContent } from './landingPurchaseContent'
import type { ProductPresentation } from '@/lib/products/presentation/getProductPresentation'

export function PurchaseClientLanding({
  commerce,
  initialVariantId,
  presentation,
  content
}: {
  commerce: ProductCommerceViewModel
  initialVariantId: string
  presentation: ProductPresentation
  content: LandingPurchaseContent
}) {
  const logic = useLandingPurchaseLogic({
    commerce,
    initialVariantId,
    presentation
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

  return (
    <PurchaseClientViewLanding {...logic} content={content} />
  )
}
