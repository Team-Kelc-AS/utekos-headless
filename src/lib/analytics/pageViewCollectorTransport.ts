import {
  extractBrowserIds,
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from './pageViewEvent'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'

export type CookiebotState = {
  consent?: CookiebotConsent
  consented?: boolean
  declined?: boolean
  hasResponse?: boolean
}

type PageViewCollectorTransportDependencies = {
  getCookiebot: () => CookiebotState | undefined
  getCookieHeader: () => string
  send: (event: CanonicalPageView) => Promise<void>
}

export type PageViewCollectorResult =
  | 'failed'
  | 'sent'
  | 'skipped'

export function hasCookiebotDecision(
  cookiebot: CookiebotState | undefined
) {
  return (
    cookiebot?.hasResponse === true ||
    cookiebot?.consented === true ||
    cookiebot?.declined === true
  )
}

export function prepareCanonicalPageViewForCollector(
  event: CanonicalPageView,
  cookiebot: CookiebotState,
  cookieHeader: string
): CanonicalPageView {
  const consent = getConsentSnapshot(cookiebot.consent)
  const hasMarketingConsent = consent.marketing === 'granted'

  const browserId =
    hasMarketingConsent ?
      extractBrowserIds(cookieHeader, consent)
    : undefined

  const baseEvent = { ...event }

  delete baseEvent.browser_id
  delete baseEvent.click_id
  delete baseEvent.client_ip_address
  delete baseEvent.external_id
  delete baseEvent.impression_id
  delete baseEvent.region_code
  delete baseEvent.user_data

  return canonicalPageViewSchema.parse({
    ...baseEvent,
    consent,
    ...(browserId ? { browser_id: browserId } : {}),
    ...(hasMarketingConsent && event.click_id ?
      { click_id: event.click_id }
    : {}),
    ...(hasMarketingConsent && event.external_id ?
      { external_id: event.external_id }
    : {}),
    ...(hasMarketingConsent && event.impression_id ?
      { impression_id: event.impression_id }
    : {}),
    ...(hasMarketingConsent && event.user_data ?
      { user_data: event.user_data }
    : {})
  })
}

export function createPageViewCollectorTransport(
  dependencies: PageViewCollectorTransportDependencies
) {
  const completedEventIds = new Set<string>()
  const inFlightEventIds = new Set<string>()
  const pendingEvents = new Map<string, CanonicalPageView>()

  function retainLatestPendingEvent() {
    let latestEvent: CanonicalPageView | undefined

    for (const event of pendingEvents.values()) {
      latestEvent = event
    }

    pendingEvents.clear()

    if (latestEvent) {
      pendingEvents.set(latestEvent.event_id, latestEvent)
    }
  }

  async function flush(): Promise<PageViewCollectorResult> {
    if (pendingEvents.size === 0) return 'skipped'

    const cookiebot = dependencies.getCookiebot()

    if (!hasCookiebotDecision(cookiebot)) {
      return 'skipped'
    }

    const consent = getConsentSnapshot(cookiebot?.consent)
    const hasPermittedPurpose =
      consent.analytics === 'granted' ||
      consent.marketing === 'granted'

    if (!hasPermittedPurpose) {
      retainLatestPendingEvent()
      return 'skipped'
    }

    const events = Array.from(pendingEvents.values()).filter(
      event =>
        !completedEventIds.has(event.event_id) &&
        !inFlightEventIds.has(event.event_id)
    )

    for (const event of events) {
      inFlightEventIds.add(event.event_id)
    }

    if (events.length === 0) return 'skipped'

    const results = await Promise.allSettled(
      events.map(async event => {
        const prepared = prepareCanonicalPageViewForCollector(
          event,
          cookiebot as CookiebotState,
          dependencies.getCookieHeader()
        )
        const enriched =
          await enrichCanonicalEventWithMetaAttribution(prepared)

        await dependencies.send(enriched)
      })
    )

    for (const [index, result] of results.entries()) {
      const event = events[index]
      if (!event) continue

      inFlightEventIds.delete(event.event_id)

      if (result.status === 'fulfilled') {
        completedEventIds.add(event.event_id)
        pendingEvents.delete(event.event_id)
      }
    }

    return results.some(result => result.status === 'rejected') ?
        'failed'
      : 'sent'
  }

  function queue(event: CanonicalPageView) {
    if (
      !completedEventIds.has(event.event_id) &&
      !inFlightEventIds.has(event.event_id) &&
      !pendingEvents.has(event.event_id)
    ) {
      pendingEvents.set(event.event_id, event)
    }

    return flush()
  }

  return { flush, queue }
}

type CookiebotWindow = Window & { Cookiebot?: CookiebotState }

export const browserPageViewCollectorTransport =
  createPageViewCollectorTransport({
    getCookiebot: () => (window as CookiebotWindow).Cookiebot,
    getCookieHeader: () => document.cookie,
    send: async event => {
      const response = await fetch('/api/events/page-view', {
        body: JSON.stringify(event),
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(
          `Page-view collector returned ${response.status}`
        )
      }
    }
  })
