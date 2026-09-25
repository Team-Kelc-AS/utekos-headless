'use client'

import { collectLeadFormTrackingContext } from './collectLeadFormTrackingContext'
import { pushGenerateLeadToDataLayer } from './pushGenerateLeadToDataLayer'
import {
  COMMERCE_INTEREST_LEAD_FORM_IDS,
  type CommerceInterestLeadFormId
} from '@/lib/leads/leadFormIds'

export function reportCommerceInterestLead(
  formId: CommerceInterestLeadFormId
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let cancelled = false

  void import('@/lib/actions/recordCommerceInterestLead')
    .then(async ({ recordCommerceInterestLead }) => {
      if (cancelled) return

      const result = await recordCommerceInterestLead({
        formId,
        trackingContext: collectLeadFormTrackingContext()
      })

      if (cancelled || result.status !== 'success') return

      // Same event_id on dataLayer + CAPI acceptance → Meta dedupe.
      pushGenerateLeadToDataLayer(result.dataLayerEvent)
    })
    .catch(error => {
      if (cancelled) return
      queueMicrotask(() => {
        throw error
      })
    })

  return () => {
    cancelled = true
  }
}

export function reportTechdownAddToCartLead(): () => void {
  return reportCommerceInterestLead(
    COMMERCE_INTEREST_LEAD_FORM_IDS.techdownAddToCart
  )
}

export function reportKlarnaExpressLead(): () => void {
  return reportCommerceInterestLead(
    COMMERCE_INTEREST_LEAD_FORM_IDS.klarnaExpressCheckout
  )
}
