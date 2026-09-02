import { createCanonicalCollectorTransport } from './createCanonicalCollectorTransport'
import type { CanonicalViewPromotion } from './viewPromotionEvent'

export const startViewPromotionCollectorTransport =
  createCanonicalCollectorTransport<CanonicalViewPromotion>({
    analyticsEventName: 'view_promotion',
    endpoint: '/api/events/view-promotion',
    fallbackEndpoint: '/api/e/vp'
  })
