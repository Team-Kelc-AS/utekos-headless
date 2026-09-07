import type { CanonicalEvent } from '@/lib/analytics/canonicalEvent'
import type { CheckoutMethod } from '@/lib/analytics/checkoutMethod'
import { classifyBrowserEventTraffic } from '@/lib/analytics/server/classifyBrowserEventTraffic'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

type CommerceEventName =
  | 'add_to_cart'
  | 'begin_checkout'
  | 'add_to_wishlist'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'generate_lead'
  | 'purchase'
type CommerceEvent = Extract<
  CanonicalEvent,
  { event_name: CommerceEventName }
>
type CommerceEventSource =
  | 'browser_collector'
  | 'shopify_web_pixel'
  | 'persisted_lead_submission'
  | 'shopify_paid_order_webhook'
  | 'shopify_paid_order_reconciliation'

type LogCanonicalCommerceEventInput = {
  checkoutMethod?: CheckoutMethod
  durationMs?: number
  event: CommerceEvent
  eventName: CommerceEventName
  request?: Request
  source?: CommerceEventSource
  status: 'accepted' | 'duplicate'
  journeyLinkReason?:
    | 'linked'
    | 'analytics_consent_not_granted'
    | 'journey_context_missing'
    | 'begin_checkout_event_id_missing'
    | 'begin_checkout_not_found'
    | 'begin_checkout_mismatch'
    | 'begin_checkout_journey_missing'
    | 'lookup_unavailable'
}

const DISPLAY_NAMES = {
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_to_wishlist: 'AddToWishlist',
  add_shipping_info: 'AddShippingInfo',
  add_payment_info: 'AddPaymentInfo',
  generate_lead: 'GenerateLead',
  purchase: 'Purchase'
} as const

export async function logCanonicalCommerceEvent(
  input: LogCanonicalCommerceEventInput
): Promise<void> {
  try {
    const event = input.event
    const source = input.source ?? 'browser_collector'
    const analyticsGranted =
      event.consent?.analytics === 'granted'
    const items =
      'items' in event.custom_data ?
        event.custom_data.items
      : undefined
    const grossValue =
      'gross_value' in event.custom_data ?
        event.custom_data.gross_value
      : event.event_name === 'purchase' ? event.custom_data.value
      : undefined
    const beginCheckoutEventId =
      'begin_checkout_event_id' in event.custom_data ?
        event.custom_data.begin_checkout_event_id
      : 'begin_checkout_event_id' in event ?
        event.begin_checkout_event_id
      : undefined
    const pageViewId =
      'page_view_id' in event ? event.page_view_id : undefined
    const journeyLinkReason =
      !analyticsGranted ?
        'analytics_consent_not_granted'
      : (input.journeyLinkReason ??
        (event.journey_id ? 'linked' : (
          'journey_context_missing'
        )))
    const vercelId = input.request?.headers.get('x-vercel-id')
    const trafficClass =
      input.request ?
        (await classifyBrowserEventTraffic(input.request))
          .classification
      : 'human_or_unknown'
    const data = {
      eventName: input.eventName,
      displayName:
        (
          event.event_name === 'generate_lead' &&
          event.custom_data.form_id ===
            'product_waitlist_utekos_dun'
        ) ?
          'Sign Up Utekos Dun'
        : DISPLAY_NAMES[input.eventName],
      eventId: event.event_id,
      status: input.status,
      persistence:
        input.status === 'accepted' ? 'persisted' : 'duplicate',
      actionEvidence:
        source === 'browser_collector' ? 'browser_reported'
        : source === 'shopify_web_pixel' ?
          'shopify_source_observed'
        : 'server_confirmed',
      source,
      trafficClass,
      providerDelivery: 'separate_receipt_required',
      journeyLinkReason,
      ...(analyticsGranted && beginCheckoutEventId ?
        { beginCheckoutEventId }
      : {}),
      ...(input.durationMs !== undefined ?
        { durationMs: input.durationMs }
      : {}),
      ...(event.custom_data.currency ?
        { currency: event.custom_data.currency }
      : {}),
      ...(grossValue !== undefined ? { grossValue } : {}),
      ...(items ?
        {
          itemCount: items.length,
          quantity: items.reduce(
            (total, item) => total + item.quantity,
            0
          )
        }
      : {}),
      ...(input.eventName === 'begin_checkout' ?
        {
          checkoutMethod:
            input.checkoutMethod ?? 'shopify_checkout'
        }
      : {})
    }

    await logToAppLogs({
      event: 'commerce.event',
      level: 'INFO',
      // The runtime schema checks the event/display-name pairing before output.
      data: data as Extract<
        Parameters<typeof logToAppLogs>[0],
        { event: 'commerce.event' }
      >['data'],
      context: {
        ...(event.page_url ? { pagePath: event.page_url } : {}),
        ...(input.request ?
          { requestPath: input.request.url }
        : {}),
        ...(vercelId ? { vercelId } : {})
      },
      eventId: event.event_id,
      eventName: input.eventName,
      eventTime: event.event_time,
      ...(analyticsGranted && event.journey_id ?
        { journeyId: event.journey_id }
      : {}),
      ...(analyticsGranted && typeof pageViewId === 'string' ?
        { pageViewId }
      : {}),
      ...(event.page_url ? { pageUrl: event.page_url } : {}),
      ...(event.consent ? { consent: event.consent } : {}),
      ...(event.environment ?
        { environment: event.environment }
      : {})
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
