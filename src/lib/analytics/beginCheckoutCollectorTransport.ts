import { enrichCanonicalEventWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import { sendCanonicalCollectorEvent } from './createCanonicalCollectorTransport'
import {
  CHECKOUT_METHOD_HEADER,
  type CheckoutMethod
} from './checkoutMethod'
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
  event: CanonicalBeginCheckout,
  checkoutMethod: CheckoutMethod
) {
  return sendCanonicalCollectorEvent(
    {
      ...beginCheckoutCollectorInput,
      headers: {
        [CHECKOUT_METHOD_HEADER]: checkoutMethod
      }
    },
    event
  )
}
