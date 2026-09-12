'use client'

import { useEffect, useRef } from 'react'
import { useLandingPurchaseLogic } from './useLandingPurchaseLogic.'
import { PurchaseClientViewLanding } from './PurchaseClientViewLanding'
import { loadViewItemReporter } from '@/lib/analytics/loadViewItemReporter'
import { createViewItemReportKey } from '@/lib/analytics/viewItemReportKey'
import type { ProductModel } from '@/lib/products/commerce'
import type { LandingPurchaseContent } from './landingPurchaseContent'
import type { ProductPresentation } from '@/lib/products/presentation/getProductPresentation'

export function PurchaseClientLanding({
  commerce,
  initialVariantId,
  presentation,
  content
}: {
  commerce: ProductModel
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

    let cancelled = false
    let cleanup = () => {}

    void loadViewItemReporter().then(
      ({ reportCanonicalViewItem }) => {
        if (cancelled) return
        cleanup = reportCanonicalViewItem({
          product: shopifyProduct,
          variant: selectedShopifyVariant,
          onEmitted: () => {
            reportedViewItemKey.current = reportKey
          }
        })
      }
    )

    return () => {
      cancelled = true
      cleanup()
    }
  }, [shopifyProduct, selectedShopifyVariant])

  return (
    <PurchaseClientViewLanding {...logic} content={content} />
  )
}
