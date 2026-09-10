import { hasCookiebotExplicitResponse } from '@/lib/consent/cookiebotConsent'
import {
  extractBrowserIds,
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from './pageViewEvent'
import type { PageViewDispatchObservation } from './pageViewDispatchObservation'
import type { ProvisionalPageViewCaptureState } from './provisionalPageViewCapture'
import { enrichCanonicalBrowserJourneyContext } from './internalJourneyContext'
import { withoutTrackingQuery } from './withoutTrackingQuery'
import { filterConsentedBrowserIds } from './filterConsentedBrowserIds'

export type CookiebotState = {
  consent?: CookiebotConsent
  consented?: boolean
  declined?: boolean
  hasResponse?: boolean
}
type Dependencies = {
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
export type PageViewCollectorResult =
  | 'captured'
  | 'failed'
  | 'sent'
  | 'skipped'
export const hasCookiebotDecision = hasCookiebotExplicitResponse

export function prepareCanonicalPageViewForCollector(
  event: CanonicalPageView,
  cookiebot: CookiebotState,
  cookieHeader: string
): CanonicalPageView {
  const live = getConsentSnapshot(
    hasCookiebotDecision(cookiebot) ?
      cookiebot.consent
    : undefined
  )
  const consent = {
    ...live,
    analytics:
      event.consent.analytics === 'granted' ?
        live.analytics
      : ('denied' as const),
    marketing:
      event.consent.marketing === 'granted' ?
        live.marketing
      : ('denied' as const)
  }
  const next = { ...event, consent }
  delete next.edge_request_id
  delete next.browser_id
  delete next.client_ip_address
  if (consent.marketing !== 'granted') {
    delete next.click_id
    delete next.external_id
    delete next.impression_id
    delete next.region_code
    delete next.user_data
    next.page_url = withoutTrackingQuery(next.page_url)
    if (next.referrer_url)
      next.referrer_url = withoutTrackingQuery(next.referrer_url)
  }
  if (consent.analytics !== 'granted') {
    delete next.experiment
    delete next.journey_id
    delete next.previous_page_view_id
  }
  const browserId = filterConsentedBrowserIds(
    {
      ...event.browser_id,
      ...extractBrowserIds(cookieHeader, consent)
    },
    consent
  )
  if (browserId) next.browser_id = browserId
  return canonicalPageViewSchema.parse(next)
}
function permitsCollection(event: CanonicalPageView) {
  return (
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'
  )
}
function permitsLiveEvent(
  event: CanonicalPageView,
  current: CookiebotState | undefined
) {
  return (
    hasCookiebotDecision(current) &&
    ((event.consent.analytics === 'granted' &&
      current?.consent?.statistics === true) ||
      (event.consent.marketing === 'granted' &&
        current?.consent?.marketing === true))
  )
}
export function createPageViewCollectorTransport(
  dependencies: Dependencies
) {
  const pending = new Map<string, CanonicalPageView>()
  const inFlight = new Set<string>()
  const completed = new Set<string>()
  let generation = 0
  function clear() {
    generation += 1
    pending.clear()
    completed.clear()
  }
  function cookieHeader() {
    try {
      return dependencies.getCookieHeader()
    } catch {
      return ''
    }
  }
  async function flush(): Promise<PageViewCollectorResult> {
    const current = dependencies.getCookiebot()
    if (
      !hasCookiebotDecision(current) ||
      (!current?.consent?.statistics &&
        !current?.consent?.marketing)
    ) {
      clear()
      return 'skipped'
    }
    const version = generation
    let result: PageViewCollectorResult = 'skipped'
    for (const [id, event] of pending) {
      if (inFlight.has(id)) continue
      inFlight.add(id)
      try {
        const beforePrepare = dependencies.getCookiebot()
        if (!permitsLiveEvent(event, beforePrepare)) {
          pending.delete(id)
          continue
        }
        const prepared = prepareCanonicalPageViewForCollector(
          event,
          beforePrepare!,
          cookieHeader()
        )
        if (!permitsCollection(prepared)) {
          pending.delete(id)
          continue
        }
        let enriched =
          enrichCanonicalBrowserJourneyContext(prepared)
        try {
          enriched = await dependencies.enrich(enriched)
        } catch {
          /* Optional enrichment does not block a consented event. */
        }
        if (version !== generation) continue
        const latest = dependencies.getCookiebot()
        if (!permitsLiveEvent(enriched, latest)) {
          clear()
          continue
        }
        const finalEvent = prepareCanonicalPageViewForCollector(
          enriched,
          latest!,
          cookieHeader()
        )
        if (!permitsCollection(finalEvent)) {
          clear()
          continue
        }
        await dependencies.capture(finalEvent, 'granted')
        if (version !== generation) continue
        const beforeSend = dependencies.getCookiebot()
        if (!permitsLiveEvent(finalEvent, beforeSend)) {
          clear()
          continue
        }
        const sendEvent = prepareCanonicalPageViewForCollector(
          finalEvent,
          beforeSend!,
          cookieHeader()
        )
        if (!permitsCollection(sendEvent)) {
          clear()
          continue
        }
        await dependencies.send(sendEvent)
        pending.delete(id)
        completed.add(id)
        if (completed.size > 128)
          completed.delete(completed.values().next().value!)
        result = 'sent'
      } catch {
        result = 'failed'
      } finally {
        inFlight.delete(id)
      }
    }
    return result
  }
  async function queue(
    event: CanonicalPageView,
    _correlation?: PageViewCollectorCorrelation
  ) {
    const current = dependencies.getCookiebot()
    if (
      !permitsCollection(event) ||
      !permitsLiveEvent(event, current)
    ) {
      clear()
      return 'skipped' as const
    }
    if (
      !completed.has(event.event_id) &&
      !pending.has(event.event_id)
    )
      pending.set(event.event_id, event)
    return flush()
  }
  return { clear, flush, queue }
}
async function post(endpoint: string, body: unknown) {
  const response = await fetch(endpoint, {
    body: JSON.stringify(body),
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    method: 'POST'
  })
  if (!response.ok)
    throw new Error(
      `Page-view collector returned ${response.status}`
    )
}
export const browserPageViewCollectorTransport =
  createPageViewCollectorTransport({
    capture: (event, captureState) =>
      post('/api/events/page-view/capture', {
        capture_state: captureState,
        event
      }),
    enrich: async event => {
      const { enrichCanonicalEventWithMetaAttribution } =
        await import('./enrichCanonicalEventWithMetaAttribution')
      return enrichCanonicalEventWithMetaAttribution(event)
    },
    getCookiebot: () => {
      const target = window as Window & {
        Cookiebot?: CookiebotState
        __utekosConsentReloading?: boolean
      }
      return target.__utekosConsentReloading ? undefined : (
          target.Cookiebot
        )
    },
    getCookieHeader: () => document.cookie,
    send: event => post('/api/events/page-view', event)
  })
