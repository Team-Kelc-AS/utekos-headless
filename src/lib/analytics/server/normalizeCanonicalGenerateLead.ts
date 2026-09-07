import {
  canonicalGenerateLeadSchema,
  type CanonicalGenerateLead
} from '../generateLeadEvent'
import type { CanonicalPurchaseRequestContext } from './normalizeCanonicalPurchase'

export type CanonicalGenerateLeadRequestContext =
  CanonicalPurchaseRequestContext

export function normalizeCanonicalGenerateLead(
  payload: unknown,
  requestContext: CanonicalGenerateLeadRequestContext
): CanonicalGenerateLead {
  const parsed = canonicalGenerateLeadSchema.parse(payload)
  const normalized = { ...parsed }
  const deviceInfo = { ...parsed.event_device_info }

  delete normalized.client_ip_address
  delete normalized.event_device_info
  delete normalized.location
  delete normalized.region_code
  delete deviceInfo.user_agent
  if (parsed.consent.analytics !== 'granted') {
    delete normalized.journey_id
    delete normalized.previous_page_view_id
    delete normalized.page_view_id
  }

  Object.assign(deviceInfo, {
    ...(requestContext.userAgent ?
      { user_agent: requestContext.userAgent }
    : {})
  })

  const serverLocation = {
    ...(requestContext.city ?
      { city: requestContext.city }
    : {}),
    ...(requestContext.countryCode ?
      { country_code: requestContext.countryCode.toUpperCase() }
    : {}),
    ...(requestContext.postalCode ?
      { postal_code: requestContext.postalCode }
    : {}),
    ...(requestContext.regionCode ?
      { region_code: requestContext.regionCode }
    : {})
  }

  const hasDeviceInfo = Object.keys(deviceInfo).length > 0
  const hasLocation = Object.keys(serverLocation).length > 0
  const hasMarketingConsent =
    parsed.consent.marketing === 'granted'
  const preservedClientIp =
    parsed.client_ip_address ?? requestContext.clientIpAddress

  if (hasDeviceInfo) normalized.event_device_info = deviceInfo
  if (requestContext.regionCode) {
    normalized.region_code = requestContext.regionCode
  }
  if (hasLocation) {
    normalized.location = {
      ...serverLocation,
      source: 'ip_geolocation'
    }
  }

  if (preservedClientIp) {
    normalized.client_ip_address = preservedClientIp
  }

  if (!hasMarketingConsent) {
    const analyticsBrowserId = {
      ...(parsed.browser_id?.ga_client ?
        { ga_client: parsed.browser_id.ga_client }
      : {}),
      ...(parsed.browser_id?.ga_client_id ?
        { ga_client_id: parsed.browser_id.ga_client_id }
      : {}),
      ...(parsed.browser_id?.ga_cookie ?
        { ga_cookie: parsed.browser_id.ga_cookie }
      : {}),
      ...(parsed.browser_id?.ga_session_id ?
        { ga_session_id: parsed.browser_id.ga_session_id }
      : {})
    }

    if (
      parsed.consent.analytics === 'granted' &&
      Object.keys(analyticsBrowserId).length > 0
    ) {
      normalized.browser_id = analyticsBrowserId
    } else {
      delete normalized.browser_id
    }

    delete normalized.click_id
    delete normalized.external_id
    delete normalized.impression_id
    delete normalized.user_data
  } else {
    if (parsed.browser_id)
      normalized.browser_id = parsed.browser_id
    if (parsed.click_id) normalized.click_id = parsed.click_id
    if (parsed.external_id)
      normalized.external_id = parsed.external_id
    if (parsed.impression_id) {
      normalized.impression_id = parsed.impression_id
    }
    if (parsed.user_data) normalized.user_data = parsed.user_data
  }

  return canonicalGenerateLeadSchema.parse(normalized)
}
