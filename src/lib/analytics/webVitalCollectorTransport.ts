import { createCanonicalCollectorTransport } from './createCanonicalCollectorTransport'
import type { CanonicalWebVital } from './webVitalEvent'

export function hasWebVitalCollectionConsent(
  event: CanonicalWebVital
) {
  return event.consent.analytics === 'granted'
}

export function createWebVitalCollectorTransport(
  enrichEvent?: (
    event: CanonicalWebVital
  ) => Promise<CanonicalWebVital>
) {
  return createCanonicalCollectorTransport<CanonicalWebVital>({
    analyticsEventName: 'web_vital',
    endpoint: '/api/events/web-vital',
    fallbackEndpoint: '/api/e/wv',
    hasCollectionConsent: hasWebVitalCollectionConsent,
    ...(enrichEvent ? { enrichEvent } : {})
  })
}
