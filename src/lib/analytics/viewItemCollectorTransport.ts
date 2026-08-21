import { captureException } from '@sentry/nextjs'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import { enrichCanonicalViewItemWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import { extractClickIds } from './pageViewClientContext'
import type { ConsentSnapshot } from './pageViewEvent'
import type { CanonicalViewItem } from './viewItemEvent'

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

export type ViewItemCollectionContext = {
  analyticsBrowserId?: Record<string, string> | undefined
  clickId?: Record<string, string> | undefined
  consent: ConsentSnapshot
  hasResponse: boolean
  marketingBrowserId?: Record<string, string> | undefined
}

export type ResolvedViewItemCollection = {
  context: ViewItemCollectionContext
  event: CanonicalViewItem
}

type ViewItemCollectorTransportDependencies = {
  postEvent: (event: CanonicalViewItem) => Promise<void>
  reportError: (error: unknown) => void
  resolveCurrentCollection: (
    event: CanonicalViewItem
  ) => ResolvedViewItemCollection
  subscribeToConsentChanges: (
    listener: () => void
  ) => () => void
}

function compactRecord(
  entries: Array<[string, string | undefined]>
): Record<string, string> | undefined {
  const record: Record<string, string> = {}

  for (const [key, value] of entries) {
    if (value) record[key] = value
  }

  return Object.keys(record).length > 0 ?
      record
    : undefined
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
      cookiebot?.consent?.statistics === true ?
        'granted'
      : 'denied',
    marketing:
      cookiebot?.consent?.marketing === true ?
        'granted'
      : 'denied',
    preferences:
      cookiebot?.consent?.preferences === true ?
        'granted'
      : 'denied',
    source: 'cookiebot',
    version
  }
}

export function applyViewItemCollectionContext(
  event: CanonicalViewItem,
  context: ViewItemCollectionContext
): CanonicalViewItem {
  const nextEvent: CanonicalViewItem = {
    ...event,
    consent: context.consent
  }

  delete nextEvent.browser_id
  delete nextEvent.click_id
  delete nextEvent.client_ip_address
  delete nextEvent.external_id
  delete nextEvent.impression_id
  delete nextEvent.location
  delete nextEvent.region_code
  delete nextEvent.user_data

  if (event.event_device_info) {
    const deviceInfo = { ...event.event_device_info }
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

  const browserId = {
    ...(analyticsGranted ?
      context.analyticsBrowserId
    : {}),
    ...(marketingGranted ? event.browser_id : {}),
    ...(marketingGranted ?
      context.marketingBrowserId
    : {})
  }

  if (Object.keys(browserId).length > 0) {
    nextEvent.browser_id = browserId
  }

  if (marketingGranted) {
    const clickId = {
      ...event.click_id,
      ...context.clickId
    }

    if (Object.keys(clickId).length > 0) {
      nextEvent.click_id = clickId
    }

    if (event.external_id) {
      nextEvent.external_id = event.external_id
    }

    if (event.impression_id) {
      nextEvent.impression_id = event.impression_id
    }

    if (event.user_data) {
      nextEvent.user_data = event.user_data
    }
  }

  if (
    preferencesGranted &&
    event.location?.source === 'browser_permission'
  ) {
    nextEvent.location = event.location
  }

  return nextEvent
}

function resolveBrowserCollection(
  event: CanonicalViewItem
): ResolvedViewItemCollection {
  const cookiebot =
    typeof window === 'undefined' ?
      undefined
    : (window as CookiebotWindow).Cookiebot

  const consent = resolveConsent(
    cookiebot,
    event.consent.version
  )

  const context: ViewItemCollectionContext = {
    consent,
    hasResponse:
      cookiebot?.hasResponse === true ||
      cookiebot?.declined === true,
    ...(consent.analytics === 'granted' ?
      {
        analyticsBrowserId: compactRecord([
          ['ga_cookie', readCookie('_ga')]
        ])
      }
    : {}),
    ...(consent.marketing === 'granted' ?
      {
        clickId: extractClickIds(event.page_url, document.cookie),
        marketingBrowserId: compactRecord([
          ['fbp', readCookie('_fbp')],
          ['fbc', readCookie('_fbc')],
          ['gcl_au', readCookie('_gcl_au')],
          [
            'uet_msclkid',
            readCookie('_uetmsclkid')
          ],
          ['uet_sid', readCookie('_uetsid')],
          ['uet_vid', readCookie('_uetvid')]
        ])
      }
    : {})
  }

  return {
    context,
    event: applyViewItemCollectionContext(
      event,
      context
    )
  }
}

function subscribeToCookiebotChanges(
  listener: () => void
): () => void {
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
  return (
    status === 408 ||
    status === 429 ||
    status >= 500
  )
}

async function postCanonicalViewItem(
  event: CanonicalViewItem
): Promise<void> {
  const metaEnrichedEvent =
    await enrichCanonicalEventWithMetaAttribution(event)
  const enrichedEvent =
    await enrichCanonicalViewItemWithGoogleAnalyticsIds(
      metaEnrichedEvent
    )

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response

    try {
      response = await fetch('/api/events/view-item', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrichedEvent),
        cache: 'no-store',
        credentials: 'same-origin',
        keepalive: true
      })
    } catch (error) {
      if (attempt === 1) throw error
      continue
    }

    if (response.ok) return

    if (
      attempt === 1 ||
      !isRetryableStatus(response.status)
    ) {
      throw new Error(
        `View-item collector returned ${response.status}`
      )
    }
  }
}

function reportCollectorError(error: unknown) {
  captureException(error, {
    tags: {
      analytics_event: 'view_item',
      analytics_transport: 'first_party_collector'
    }
  })
}

function hasCollectionConsent(
  event: CanonicalViewItem
) {
  return (
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'
  )
}

export function createViewItemCollectorTransport(
  dependencies: ViewItemCollectorTransportDependencies
) {
  return function startCollectorTransport(
    event: CanonicalViewItem
  ): () => void {
    let finished = false
    let unsubscribe: () => void = () => {}

    const finish = () => {
      if (finished) return

      finished = true
      unsubscribe()
    }

    const evaluate = () => {
      if (finished) return

      const current =
        dependencies.resolveCurrentCollection(event)

      if (hasCollectionConsent(current.event)) {
        finish()

        void dependencies
          .postEvent(current.event)
          .catch(dependencies.reportError)

        return
      }

      if (current.context.hasResponse) {
        finish()
      }
    }

    evaluate()

    if (!finished) {
      unsubscribe =
        dependencies.subscribeToConsentChanges(
          evaluate
        )

      evaluate()
    }

    return finish
  }
}

const startBrowserViewItemCollector =
  createViewItemCollectorTransport({
    postEvent: postCanonicalViewItem,
    reportError: reportCollectorError,
    resolveCurrentCollection: resolveBrowserCollection,
    subscribeToConsentChanges:
      subscribeToCookiebotChanges
  })

export function startViewItemCollectorTransport(
  event: CanonicalViewItem
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  return startBrowserViewItemCollector(event)
}
