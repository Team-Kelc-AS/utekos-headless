import { reportCanonicalSelectPromotion } from '@/lib/analytics/selectPromotionReporter'

export function reportComfyrobePurchaseSelection(
  creativeName: string,
  creativeSlot: string
) {
  reportCanonicalSelectPromotion({
    customData: {
      interaction_id: globalThis.crypto.randomUUID(),
      promotion_id: 'comfyrobe-purchase',
      promotion_name: 'Comfyrobe',
      creative_name: creativeName,
      creative_slot: creativeSlot
    }
  })
}
