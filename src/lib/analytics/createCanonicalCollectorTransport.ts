import { captureException } from '@sentry/nextjs'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import { extractClickIds } from './pageViewClientContext'

const COOKIEBOT_EVENTS = [
  'CookiebotOnConsentReady',
  'CookiebotOnAccept',
  'CookiebotOnDecline'
] as const

type CookiebotConsent = {
  marketing?: boolean
  preferences?: boolean
  statistics?: boolean
}

type CookiebotApi = {
  consent?: CookiebotConsent
  declined?: boolean
  hasResponse?: boolean
}

type CookiebotWindow = Window & { Cookiebot?: CookiebotApi }

export type CanonicalCollectionContext = {
  analyticsBrowserId?: Record<string, string> | undefined
  clickId?: Record<string, string> | undefined
  consent: ConsentSnapshot
  hasResponse: boolean
  marketingBrowserId?: Record<string, string> | undefined
}

type EventWithConsent = {
  consent: ConsentSnapshot
  page_url?: string | undefined
  browser_id?: Record<string, string> | undefined
  click_id?: Record<string, string> | undefined
  client_ip_address?: string | undefined
  external_id?: string | undefined
  impression_id?: string | undefined
  location?: {
    source?:
      | 'browser_permission'
      | 'customer_provided'
      | 'ip_geolocation'
      | 'server_request'
    [key: string]: unknown
  } | undefined
  region_code?: string | undefined
  user_data?: unknown
  event_device_info?: {
    user_agent?: string | undefined
    [key: string]: unknown
  } | undefined
}

type CreateCanonicalCollectorTransportInput<E extends { consent: ConsentSnapshot }> = {
  analyticsEventName: string
  endpoint: string
  enrichEvent?: (event: E) => Promise<E>
  hasCollectionConsent?: (event: E) => boolean
}

type SendCanonicalCollectorEventInput<E extends { consent: ConsentSnapshot }> =
  Pick<
    CreateCanonicalCollectorTransportInput<E>,
    'analyticsEventName' | 'endpoint' | 'enrichEvent'
  > & {
    headers?: Readonly<Record<string, string>>
  }

function compactRecord(
  entries: Array<[string, string | undefined]>
): Record<string, string> | undefined {
  const record: Record<string, string> = {}

  for (const [key, value] of entries) {
    if (value) record[key] = value
  }

  return Object.keys(record).length > 0 ? record : undefined
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const prefix = `${name}=`
  const cookie = document.cookie
    .split('; ')
    .find(candidate => candidate.startsWith(prefix))

  return cookie?.slice(prefix.length) || undefined
}

function resolveConsent(
  cookiebot: CookiebotApi | undefined,
  version: string
): ConsentSnapshot {
  return {
    analytics:
      cookiebot?.consent?.statistics === true ? 'granted' : 'denied',
    marketing:
      cookiebot?.consent?.marketing === true ? 'granted' : 'denied',
    preferences:
      cookiebot?.consent?.preferences === true ? 'granted' : 'denied',
    source: 'cookiebot',
    version
  }
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

  const analyticsGranted = context.consent.analytics === 'granted'
  const marketingGranted = context.consent.marketing === 'granted'
  const preferencesGranted = context.consent.preferences === 'granted'

  const browserId = {
    ...(analyticsGranted ? context.analyticsBrowserId : {}),
    ...(marketingGranted ? source.browser_id : {}),
    ...(marketingGranted ? context.marketingBrowserId : {})
  }

  if (Object.keys(browserId).length > 0) {
    nextEvent.browser_id = browserId
  }

  if (marketingGranted) {
    const clickId = {
      ...source.click_id,
      ...context.clickId
    }

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

function resolveBrowserCollection<E extends { consent: ConsentSnapshot; page_url?: string }>(
  event: E
): { context: CanonicalCollectionContext; event: E } {
  const cookiebot =
    typeof window === 'undefined' ?
      undefined
    : (window as CookiebotWindow).Cookiebot

  const consent = resolveConsent(cookiebot, event.consent.version)
  const pageUrl = event.page_url ?? 'https://utekos.no/'

  const context: CanonicalCollectionContext = {
    consent,
    hasResponse:
      cookiebot?.hasResponse === true || cookiebot?.declined === true,
    ...(consent.analytics === 'granted' ?
      {
        analyticsBrowserId: compactRecord([
          ['ga_cookie', readCookie('_ga')]
        ])
      }
    : {}),
    ...(consent.marketing === 'granted' ?
      {
        clickId: extractClickIds(pageUrl, document.cookie),
        marketingBrowserId: compactRecord([
          ['fbp', readCookie('_fbp')],
          ['fbc', readCookie('_fbc')],
          ['gcl_au', readCookie('_gcl_au')],
          ['uet_msclkid', readCookie('_uetmsclkid')],
          ['uet_sid', readCookie('_uetsid')],
          ['uet_vid', readCookie('_uetvid')]
        ])
      }
    : {})
  }

  return {
    context,
    event: applyCanonicalCollectionContext(event, context)
  }
}

function subscribeToCookiebotChanges(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  for (const eventName of COOKIEBOT_EVENTS) {
    window.addEventListener(eventName, listener)
  }

  return () => {
    for (const eventName of COOKIEBOT_EVENTS) {
      window.removeEventListener(eventName, listener)
    }
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

function defaultHasCollectionConsent(event: { consent: ConsentSnapshot }) {
  return (
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'
  )
}

export async function sendCanonicalCollectorEvent<
  E extends { consent: ConsentSnapshot }
>(
  input: SendCanonicalCollectorEventInput<E>,
  event: E
): Promise<void> {
  const metaEnriched =
    await enrichCanonicalEventWithMetaAttribution(event)
  const enriched =
    input.enrichEvent ?
      await input.enrichEvent(metaEnriched)
    : metaEnriched

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response

    try {
      response = await fetch(input.endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...input.headers
        },
        body: JSON.stringify(enriched),
        cache: 'no-store',
        credentials: 'same-origin',
        keepalive: true
      })
    } catch (error) {
      if (attempt === 1) throw error
      continue
    }

    if (response.ok) return

    if (attempt === 1 || !isRetryableStatus(response.status)) {
      throw new Error(
        `${input.analyticsEventName} collector returned ${response.status}`
      )
    }
  }
}

export function createCanonicalCollectorTransport<
  E extends { consent: ConsentSnapshot }
>(input: CreateCanonicalCollectorTransportInput<E>) {
  const hasCollectionConsent =
    input.hasCollectionConsent ?? defaultHasCollectionConsent

  function reportError(error: unknown) {
    captureException(error, {
      tags: {
        analytics_event: input.analyticsEventName,
        analytics_transport: 'first_party_collector'
      }
    })
  }

  return function startCollectorTransport(event: E): () => void {
    if (typeof window === 'undefined') {
      return () => {}
    }

    let finished = false
    let unsubscribe: () => void = () => {}

    const finish = () => {
      if (finished) return
      finished = true
      unsubscribe()
    }

    const evaluate = () => {
      if (finished) return

      const current = resolveBrowserCollection(event)

      if (hasCollectionConsent(current.event)) {
        finish()
        void sendCanonicalCollectorEvent(
          input,
          current.event
        ).catch(reportError)
        return
      }

      if (current.context.hasResponse) {
        finish()
      }
    }

    evaluate()

    if (!finished) {
      unsubscribe = subscribeToCookiebotChanges(evaluate)
      evaluate()
    }

    return finish
  }
}
