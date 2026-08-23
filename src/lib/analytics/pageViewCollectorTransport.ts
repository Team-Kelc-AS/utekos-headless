import {
  extractBrowserIds,
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from './pageViewEvent'
import {
  browserPageViewDispatchObservationTransport,
  type PageViewDispatchObservation
} from './pageViewDispatchObservation'
import type { ProvisionalPageViewCaptureState } from './provisionalPageViewCapture'

export type CookiebotState = {
  consent?: CookiebotConsent
  consented?: boolean
  declined?: boolean
  hasResponse?: boolean
}

type PageViewCollectorTransportDependencies = {
  capture: (
    event: CanonicalPageView,
    state: ProvisionalPageViewCaptureState
  ) => Promise<void>
  enrich: (
    event: CanonicalPageView
  ) => Promise<CanonicalPageView>
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
  | 'captured'
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
  const capturedEventStates = new Map<
    string,
    ProvisionalPageViewCaptureState
  >()
  const captureInFlightEvents = new Map<
    string,
    Promise<boolean>
  >()
  const completedEventIds = new Set<string>()
  const inFlightEventIds = new Set<string>()
  const pendingEvents = new Map<string, PendingPageView>()

  function captureStateRank(
    state: ProvisionalPageViewCaptureState
  ) {
    if (state === 'granted') return 2
    if (state === 'denied') return 1
    return 0
  }

  function resolveCaptureState(
    cookiebot: CookiebotState | undefined
  ): ProvisionalPageViewCaptureState {
    if (!hasCookiebotDecision(cookiebot)) return 'pending'

    const consent = getConsentSnapshot(cookiebot?.consent)
    return (
        consent.analytics === 'granted' ||
        consent.marketing === 'granted'
      ) ?
        'granted'
      : 'denied'
  }

  async function capturePendingEvent(
    pending: PendingPageView,
    state: ProvisionalPageViewCaptureState
  ) {
    const eventId = pending.event.event_id
    const capturedState = capturedEventStates.get(eventId)

    if (
      capturedState &&
      captureStateRank(capturedState) >= captureStateRank(state)
    ) {
      return true
    }

    const inFlight = captureInFlightEvents.get(eventId)
    if (inFlight) {
      await inFlight
      return capturePendingEvent(pending, state)
    }

    const operation = (async () => {
      try {
        await dependencies.capture(pending.event, state)
        capturedEventStates.set(eventId, state)
        return true
      } catch {
        return false
      }
    })()

    captureInFlightEvents.set(eventId, operation)
    const result = await operation
    if (captureInFlightEvents.get(eventId) === operation) {
      captureInFlightEvents.delete(eventId)
    }
    return result
  }

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
      const results = await Promise.all(
        Array.from(pendingEvents.values()).map(pending =>
          capturePendingEvent(pending, 'pending')
        )
      )
      return results.every(Boolean) ? 'captured' : 'failed'
    }

    const consent = getConsentSnapshot(cookiebot?.consent)
    const hasPermittedPurpose =
      consent.analytics === 'granted' ||
      consent.marketing === 'granted'

    if (!hasPermittedPurpose) {
      const results = await Promise.all(
        Array.from(pendingEvents.values()).map(pending =>
          capturePendingEvent(pending, 'denied')
        )
      )
      retainLatestPendingEvent()
      return results.every(Boolean) ? 'captured' : 'failed'
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
        await capturePendingEvent(pending, 'granted')
        const prepared = prepareCanonicalPageViewForCollector(
          event,
          cookiebot as CookiebotState,
          dependencies.getCookieHeader()
        )
        const enriched = await dependencies.enrich(prepared)

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

  async function queue(
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

    const pending = pendingEvents.get(event.event_id)
    if (pending) {
      await capturePendingEvent(
        pending,
        resolveCaptureState(dependencies.getCookiebot())
      )
    }

    return flush()
  }

  return { flush, queue }
}

type CookiebotWindow = Window & { Cookiebot?: CookiebotState }

export const browserPageViewCollectorTransport =
  createPageViewCollectorTransport({
    capture: async (event, captureState) => {
      const response = await fetch(
        '/api/events/page-view/capture',
        {
          body: JSON.stringify({
            capture_state: captureState,
            event
          }),
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          method: 'POST'
        }
      )

      if (!response.ok) {
        throw new Error(
          `Page-view capture returned ${response.status}`
        )
      }
    },
    enrich: async event => {
      const { enrichCanonicalEventWithMetaAttribution } =
        await import('./enrichCanonicalEventWithMetaAttribution')
      return enrichCanonicalEventWithMetaAttribution(event)
    },
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
