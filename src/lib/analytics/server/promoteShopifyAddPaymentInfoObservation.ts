import {
  canonicalAddPaymentInfoSchema,
  deterministicAddPaymentInfoEventId,
  type CanonicalAddPaymentInfo
} from '../addPaymentInfoEvent'
import {
  canonicalBeginCheckoutSchema,
  type CanonicalBeginCheckout
} from '../beginCheckoutEvent'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import type { ShopifyCheckoutObservation } from '../shopifyCheckoutObservationContract'
import type { CanonicalEventStore } from './canonicalEventStore'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import type { ShopifyAddPaymentInfoCanonicalConfig } from './shopifyAddPaymentInfoCanonicalConfig'

const MAX_SOURCE_GAP_MS = 24 * 60 * 60 * 1_000

type PromotionStore = CanonicalEventStore & {
  find: NonNullable<CanonicalEventStore['find']>
}

type Dependencies = {
  config: ShopifyAddPaymentInfoCanonicalConfig
  environment: CanonicalEventEnvelope['environment']
  now?: () => Date
  store: PromotionStore
}

export type ShopifyAddPaymentInfoPromotionResult = {
  eventId?: string
  status: 'duplicate' | 'inserted' | 'not_applicable'
}

export async function promoteShopifyAddPaymentInfoObservation(
  observation: ShopifyCheckoutObservation,
  dependencies: Dependencies
): Promise<ShopifyAddPaymentInfoPromotionResult> {
  if (
    !dependencies.config.enabled ||
    observation.schemaVersion !== 2 ||
    observation.eventName !== 'payment_info_submitted' ||
    !observation.privacy.analyticsProcessingAllowed ||
    Date.parse(observation.occurredAt) <
      Date.parse(dependencies.config.cutoverAt)
  ) {
    return { status: 'not_applicable' }
  }

  const source = await dependencies.store.find({
    event_id: observation.correlation.beginCheckoutEventId,
    event_name: 'begin_checkout'
  })

  if (!source) {
    throw new Error('canonical_begin_checkout_not_ready')
  }

  const beginCheckout = canonicalBeginCheckoutSchema.parse(source)
  assertCompatibleSource(
    observation,
    beginCheckout,
    dependencies.environment
  )

  const event = mapObservationToCanonicalAddPaymentInfo(
    observation,
    beginCheckout,
    dependencies.environment
  )
  const accepted = await dependencies.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event,
    sourceEvidence: {
      canonical_event_id: event.event_id,
      source_system: 'shopify',
      source_method: 'web_pixel',
      source_object_type: 'checkout',
      source_object_id: observation.checkoutToken,
      source_topic: 'payment_info_submitted',
      source_delivery_id: null,
      source_event_id: observation.eventId,
      source_api_version: '2026-04',
      source_triggered_at: observation.occurredAt,
      source_observed_at: (
        dependencies.now ?? (() => new Date())
      )().toISOString()
    }
  })

  return {
    eventId: event.event_id,
    status: accepted.status
  }
}

function assertCompatibleSource(
  observation: Extract<
    ShopifyCheckoutObservation,
    { schemaVersion: 2 }
  >,
  beginCheckout: CanonicalBeginCheckout,
  environment: CanonicalEventEnvelope['environment']
) {
  const observationTime = Date.parse(observation.occurredAt)
  const sourceTime = Date.parse(beginCheckout.event_time)
  const sourceGap = observationTime - sourceTime
  const itemQuantity = beginCheckout.custom_data.items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  if (
    beginCheckout.environment !== environment ||
    beginCheckout.consent.analytics !== 'granted' ||
    sourceGap < 0 ||
    sourceGap > MAX_SOURCE_GAP_MS ||
    itemQuantity !== observation.commerce.itemQuantity ||
    (observation.commerce.currencyCode !== null &&
      observation.commerce.currencyCode !==
        beginCheckout.custom_data.currency)
  ) {
    throw new Error('canonical_begin_checkout_mismatch')
  }
}

function analyticsBrowserIds(beginCheckout: CanonicalBeginCheckout) {
  const identifiers = {
    ...(beginCheckout.browser_id?.ga_client ?
      { ga_client: beginCheckout.browser_id.ga_client }
    : {}),
    ...(beginCheckout.browser_id?.ga_client_id ?
      { ga_client_id: beginCheckout.browser_id.ga_client_id }
    : {}),
    ...(beginCheckout.browser_id?.ga_cookie ?
      { ga_cookie: beginCheckout.browser_id.ga_cookie }
    : {}),
    ...(beginCheckout.browser_id?.ga_session_id ?
      { ga_session_id: beginCheckout.browser_id.ga_session_id }
    : {})
  }

  return Object.keys(identifiers).length > 0 ?
      identifiers
    : undefined
}

export function mapObservationToCanonicalAddPaymentInfo(
  observation: Extract<
    ShopifyCheckoutObservation,
    { schemaVersion: 2 }
  >,
  beginCheckout: CanonicalBeginCheckout,
  environment: CanonicalEventEnvelope['environment']
): CanonicalAddPaymentInfo {
  const browserId = analyticsBrowserIds(beginCheckout)

  return canonicalAddPaymentInfoSchema.parse({
    schema_version: 1,
    event_name: 'add_payment_info',
    event_id: deterministicAddPaymentInfoEventId(
      observation.eventId
    ),
    event_time: observation.occurredAt,
    source: 'web',
    environment,
    consent: {
      analytics: 'granted',
      marketing: 'denied',
      preferences:
        beginCheckout.consent.preferences === 'granted' &&
        observation.privacy.preferencesProcessingAllowed ?
          'granted'
        : 'denied',
      source: 'cookiebot',
      version: beginCheckout.consent.version
    },
    ...(browserId ? { browser_id: browserId } : {}),
    custom_data: {
      currency: beginCheckout.custom_data.currency,
      value: beginCheckout.custom_data.value,
      gross_value: beginCheckout.custom_data.gross_value,
      tax_value: beginCheckout.custom_data.tax_value,
      items: beginCheckout.custom_data.items,
      checkout_id: observation.checkoutToken,
      payment_revision: observation.eventId,
      begin_checkout_event_id:
        observation.correlation.beginCheckoutEventId
    }
  })
}
