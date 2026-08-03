import type { CanonicalAddToCart } from '@/lib/analytics/addToCartEvent'
import type { CanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutEvent'
import type { CheckoutMethod } from '@/lib/analytics/checkoutMethod'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

type CommerceEventStatus = 'accepted' | 'duplicate'

type LogCanonicalCommerceEventInput =
  | {
      checkoutMethod?: never
      durationMs: number
      event: CanonicalAddToCart
      eventName: 'add_to_cart'
      request: Request
      status: CommerceEventStatus
    }
  | {
      checkoutMethod: CheckoutMethod
      durationMs: number
      event: CanonicalBeginCheckout
      eventName: 'begin_checkout'
      request: Request
      status: CommerceEventStatus
    }

export async function logCanonicalCommerceEvent(
  input: LogCanonicalCommerceEventInput
): Promise<void> {
  const quantity = input.event.custom_data.items.reduce(
    (total, item) => total + item.quantity,
    0
  )
  const vercelId = input.request.headers.get('x-vercel-id')
  const commonData = {
    currency: input.event.custom_data.currency,
    durationMs: input.durationMs,
    eventId: input.event.event_id,
    grossValue: input.event.custom_data.gross_value,
    itemCount: input.event.custom_data.items.length,
    quantity,
    status: input.status
  }
  const data =
    input.eventName === 'begin_checkout' ?
      {
        ...commonData,
        checkoutMethod: input.checkoutMethod,
        eventName: input.eventName
      }
    : {
        ...commonData,
        eventName: input.eventName
      }

  try {
    await logToAppLogs({
      event: 'commerce.event',
      level: 'INFO',
      data,
      context: {
        pagePath: input.event.page_url,
        requestPath:
          input.eventName === 'add_to_cart' ?
            '/api/events/add-to-cart'
          : '/api/events/begin-checkout',
        ...(vercelId ? { vercelId } : {})
      }
    })
  } catch {
    try {
      console.warn(
        JSON.stringify({
          event: 'commerce.runtime_log_failed',
          eventId: input.event.event_id,
          eventName: input.eventName
        })
      )
    } catch {}
  }
}
