'use client'

import { reportCanonicalSelectPromotion } from '@/lib/analytics/selectPromotionReporter'

export const LANDING_PROMOTIONS = {
  heroCta: {
    promotion_id: 'skreddersy-varmen-hero',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'Finn din favoritt',
    creative_slot: 'primary_cta'
  },
  heroSecondary: {
    promotion_id: 'skreddersy-varmen-hero',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'Se løsningen',
    creative_slot: 'secondary_cta'
  },
  heroScrollCue: {
    promotion_id: 'skreddersy-varmen-hero',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'Bla videre',
    creative_slot: 'scroll_cue'
  },
  empathyCta: {
    promotion_id: 'skreddersy-varmen-empathy',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'Utforsk kolleksjonen',
    creative_slot: 'empathy_cta'
  },
  stickyCta: {
    promotion_id: 'skreddersy-varmen-sticky',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'TechDown fra 1990',
    creative_slot: 'sticky_product'
  },
  stickyOrder: {
    promotion_id: 'skreddersy-varmen-sticky',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'Til bestilling',
    creative_slot: 'sticky_primary_cta'
  },
  sizeGuide: {
    promotion_id: 'skreddersy-varmen-purchase',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'Se størrelsesguide',
    creative_slot: 'purchase_size_guide'
  },
  shippingReturns: {
    promotion_id: 'skreddersy-varmen-purchase',
    promotion_name: 'Skreddersy varmen',
    creative_name: 'Frakt og retur',
    creative_slot: 'purchase_shipping_returns'
  }
} as const

export type LandingPromotionKey = keyof typeof LANDING_PROMOTIONS

export function reportLandingSelectPromotion(
  key: LandingPromotionKey
): void {
  const promotion = LANDING_PROMOTIONS[key]
  reportCanonicalSelectPromotion({
    customData: {
      interaction_id: globalThis.crypto.randomUUID(),
      promotion_id: promotion.promotion_id,
      promotion_name: promotion.promotion_name,
      creative_name: promotion.creative_name,
      creative_slot: promotion.creative_slot
    }
  })
}
