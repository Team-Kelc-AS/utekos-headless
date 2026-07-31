import { enrichCanonicalEventWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import { sendCanonicalCollectorEvent } from './createCanonicalCollectorTransport'
import type { CanonicalBeginCheckout } from './beginCheckoutEvent'

async function enrichBeginCheckout(
  event: CanonicalBeginCheckout
): Promise<CanonicalBeginCheckout> {
  return enrichCanonicalEventWithGoogleAnalyticsIds(event)
}

const beginCheckoutCollectorInput = {
  analyticsEventName: 'begin_checkout',
  endpoint: '/api/events/begin-checkout',
  enrichEvent: enrichBeginCheckout
} as const

export function collectCanonicalBeginCheckout(
  event: CanonicalBeginCheckout
) {
  return sendCanonicalCollectorEvent(
    beginCheckoutCollectorInput,
    event
  )
}
