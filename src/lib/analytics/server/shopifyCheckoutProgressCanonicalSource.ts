import type { CanonicalBeginCheckout } from '../beginCheckoutEvent'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import type { ShopifyCanonicalCheckoutProgressObservation } from '../shopifyCheckoutObservationContract'

const MAX_SOURCE_GAP_MS = 24 * 60 * 60 * 1_000

export function assertCompatibleCheckoutProgressSource(
  observation: ShopifyCanonicalCheckoutProgressObservation,
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

  return Object.keys(identifiers).length > 0 ? identifiers : undefined
}

export function checkoutProgressCanonicalEnvelope(
  observation: ShopifyCanonicalCheckoutProgressObservation,
  beginCheckout: CanonicalBeginCheckout
) {
  const marketingGranted =
    beginCheckout.consent.marketing === 'granted' &&
    observation.privacy.marketingAllowed
  const browserId =
    marketingGranted ?
      beginCheckout.browser_id
    : analyticsBrowserIds(beginCheckout)

  return {
    consent: {
      analytics: 'granted' as const,
      marketing: marketingGranted ?
        ('granted' as const)
      : ('denied' as const),
      preferences:
        beginCheckout.consent.preferences === 'granted' &&
        observation.privacy.preferencesProcessingAllowed ?
          ('granted' as const)
        : ('denied' as const),
      source: beginCheckout.consent.source,
      version: beginCheckout.consent.version
    },
    page_url: beginCheckout.page_url,
    ...(browserId ? { browser_id: browserId } : {}),
    ...(marketingGranted && beginCheckout.click_id ?
      { click_id: beginCheckout.click_id }
    : {}),
    ...(marketingGranted && beginCheckout.external_id ?
      { external_id: beginCheckout.external_id }
    : {}),
    ...(marketingGranted && beginCheckout.user_data ?
      { user_data: beginCheckout.user_data }
    : {}),
    ...(marketingGranted && beginCheckout.client_ip_address ?
      { client_ip_address: beginCheckout.client_ip_address }
    : {}),
    ...(marketingGranted && beginCheckout.event_device_info ?
      { event_device_info: beginCheckout.event_device_info }
    : {}),
    ...(marketingGranted && beginCheckout.location ?
      { location: beginCheckout.location }
    : {})
  }
}
