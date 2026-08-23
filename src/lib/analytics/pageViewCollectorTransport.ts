import {
  extractBrowserIds,
  extractClickIds,
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from './pageViewEvent'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import {
  browserPageViewDispatchObservationTransport,
  type PageViewDispatchObservation
} from './pageViewDispatchObservation'

export type CookiebotState = {
  consent?: CookiebotConsent
  consented?: boolean
  declined?: boolean
  hasResponse?: boolean
}

type PageViewCollectorTransportDependencies = {
  getCookiebot: () => CookiebotState | undefined
  getCookieHeader: () => string
  observeDispatch?: (
    observation: PageViewDispatchObservation
  ) => Promise<unknown>
  send: (event: CanonicalPageView) => Promise<void>
}

export type PageViewCollectorCorrelation = {
  edgeRequestId: string
  token: string
}

type PendingPageView = {
  correlation?: PageViewCollectorCorrelation
  event: CanonicalPageView
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
  const clickId =
    hasMarketingConsent ?
      {
        ...(event.click_id ?? {}),
        ...(extractClickIds(event.page_url, cookieHeader, true) ?? {})
      }
    : {}

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
    ...(Object.keys(clickId).length > 0 ? { click_id: clickId } : {}),
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
  const pendingEvents = new Map<string, PendingPageView>()

  function retainLatestPendingEvent() {
    let latestEvent: PendingPageView | undefined

    for (const event of pendingEvents.values()) {
      latestEvent = event
    }

    pendingEvents.clear()

    if (latestEvent) {
      pendingEvents.set(latestEvent.event.event_id, latestEvent)
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

    const pendingPageViews = Array.from(
      pendingEvents.values()
    ).filter(
      pending =>
        !completedEventIds.has(pending.event.event_id) &&
        !inFlightEventIds.has(pending.event.event_id)
    )

    for (const pending of pendingPageViews) {
      inFlightEventIds.add(pending.event.event_id)
    }

    if (pendingPageViews.length === 0) return 'skipped'

    const results = await Promise.allSettled(
      pendingPageViews.map(async pending => {
        const { correlation, event } = pending
        const prepared = prepareCanonicalPageViewForCollector(
          event,
          cookiebot as CookiebotState,
          dependencies.getCookieHeader()
        )
        const enriched =
          await enrichCanonicalEventWithMetaAttribution(prepared)

        if (
          dependencies.observeDispatch &&
          correlation &&
          enriched.edge_request_id === correlation.edgeRequestId
        ) {
          void dependencies
            .observeDispatch({
              correlation_token: correlation.token,
              edge_request_id: correlation.edgeRequestId,
              event_id: enriched.event_id,
              event_name: 'page_view',
              page_view_id: enriched.page_view_id
            })
            .catch(() => undefined)
        }

        await dependencies.send(enriched)
      })
    )

    for (const [index, result] of results.entries()) {
      const pending = pendingPageViews[index]
      if (!pending) continue
      const { event } = pending

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

  function queue(
    event: CanonicalPageView,
    correlation?: PageViewCollectorCorrelation
  ) {
    if (
      !completedEventIds.has(event.event_id) &&
      !inFlightEventIds.has(event.event_id) &&
      !pendingEvents.has(event.event_id)
    ) {
      pendingEvents.set(event.event_id, {
        ...(correlation ? { correlation } : {}),
        event
      })
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
    observeDispatch: observation =>
      browserPageViewDispatchObservationTransport.observe(
        observation
      ),
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
