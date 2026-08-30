import type { ConsentSnapshot } from './canonicalEventEnvelope'
import type { SkreddersyVarmenLayoutAssignment } from '@/lib/experiments/skreddersyVarmenLayoutExperiment'

export type CanonicalCollectionContext = {
  analyticsBrowserId?: Record<string, string> | undefined
  clickId?: Record<string, string> | undefined
  consent: ConsentSnapshot
  experiment?: SkreddersyVarmenLayoutAssignment | undefined
  hasResponse: boolean
  marketingBrowserId?: Record<string, string> | undefined
}

type EventWithConsent = {
  browser_id?: Record<string, string> | undefined
  click_id?: Record<string, string> | undefined
  client_ip_address?: string | undefined
  consent: ConsentSnapshot
  event_device_info?:
    | { user_agent?: string | undefined; [key: string]: unknown }
    | undefined
  experiment?: SkreddersyVarmenLayoutAssignment | undefined
  external_id?: string | undefined
  impression_id?: string | undefined
  location?:
    | {
        source?:
          | 'browser_permission'
          | 'customer_provided'
          | 'ip_geolocation'
          | 'server_request'
        [key: string]: unknown
      }
    | undefined
  page_url?: string | undefined
  region_code?: string | undefined
  user_data?: unknown
}

export function applyCanonicalCollectionContext<
  E extends { consent: ConsentSnapshot }
>(event: E, context: CanonicalCollectionContext): E {
  const source = event as E & EventWithConsent
  const nextEvent = {
    ...source,
    consent: context.consent
  } as E & EventWithConsent

  delete nextEvent.browser_id
  delete nextEvent.click_id
  delete nextEvent.client_ip_address
  delete nextEvent.external_id
  delete nextEvent.experiment
  delete nextEvent.impression_id
  delete nextEvent.location
  delete nextEvent.region_code
  delete nextEvent.user_data

  if (source.event_device_info) {
    const deviceInfo = { ...source.event_device_info }
    delete deviceInfo.user_agent

    if (Object.keys(deviceInfo).length > 0) {
      nextEvent.event_device_info = deviceInfo
    } else {
      delete nextEvent.event_device_info
    }
  }

  const analyticsGranted =
    context.consent.analytics === 'granted'
  const marketingGranted =
    context.consent.marketing === 'granted'
  const preferencesGranted =
    context.consent.preferences === 'granted'
  const experiment =
    analyticsGranted ?
      (context.experiment ?? source.experiment)
    : undefined

  const browserId = {
    ...(analyticsGranted ? context.analyticsBrowserId : {}),
    ...(marketingGranted ? source.browser_id : {}),
    ...(marketingGranted ? context.marketingBrowserId : {})
  }

  if (Object.keys(browserId).length > 0) {
    nextEvent.browser_id = browserId
  }

  if (experiment) {
    nextEvent.experiment = experiment
  }

  if (marketingGranted) {
    const clickId = { ...source.click_id, ...context.clickId }

    if (Object.keys(clickId).length > 0) {
      nextEvent.click_id = clickId
    }

    if (source.external_id) {
      nextEvent.external_id = source.external_id
    }

    if (source.impression_id) {
      nextEvent.impression_id = source.impression_id
    }

    if (source.user_data) {
      nextEvent.user_data = source.user_data
    }
  }

  if (
    preferencesGranted &&
    source.location?.source === 'browser_permission'
  ) {
    nextEvent.location = source.location
  }

  return nextEvent as E
}
