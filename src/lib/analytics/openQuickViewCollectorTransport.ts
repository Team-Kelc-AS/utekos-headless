import { createCanonicalCollectorTransport } from './createCanonicalCollectorTransport'
import type { CanonicalOpenQuickView } from './openQuickViewEvent'

export const startOpenQuickViewCollectorTransport =
  createCanonicalCollectorTransport<CanonicalOpenQuickView>({
    analyticsEventName: 'open_quick_view',
    endpoint: '/api/events/open-quick-view'
  })
