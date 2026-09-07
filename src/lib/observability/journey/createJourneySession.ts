import type { ConsentSnapshot } from '@/lib/analytics/canonicalEventEnvelope'
import type { CookiebotApi } from '@/lib/consent/cookiebotConsent'
import { hasCookiebotStatisticsConsent } from '@/lib/consent/cookiebotConsent'
import { getConsentSnapshot } from '@/lib/analytics/pageViewClientContext'
import type { PageViewContext } from '@/lib/analytics/pageViewSession'
import {
  journeyUtmSchema,
  sanitizeJourneyPath
} from './contract'
import type { JourneyEvent, JourneySection } from './contract'

const COHORT_KEY = 'utekos:analytics:utm-journey:v1'
type JourneyFields = {
  consent: ConsentSnapshot
  page_view_id?: string
  journey_id?: string
}
export type JourneyPage = {
  journeyId: string
  pageViewId: string
  previousPageViewId?: string
  pagePath: string
  consent: JourneyEvent['consent']
  arrived: boolean
  landingRecorded: boolean
  utm?: Extract<
    JourneyEvent,
    { event_name: 'utm_landing_page_view' }
  >['data']
  sections: Set<JourneySection>
  maxScrollY: number
  maxScrollPercent: number
  documentHeight: number
  viewportHeight: number
  lastVisibleSection?: JourneySection
  progressSignature: string
  lastProgressAt: number
}

export function createJourneySession(dependencies: {
  enrich: (input: JourneyFields) => JourneyFields
  getStorage: () =>
    | Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
    | undefined
}) {
  let cohortId: string | undefined
  let lastPageViewId: string | undefined
  const pages = new Map<string, JourneyPage>()

  function revoke() {
    cohortId = undefined
    lastPageViewId = undefined
    pages.clear()
    dependencies.enrich({
      consent: getConsentSnapshot(undefined)
    })
    try {
      dependencies.getStorage()?.removeItem(COHORT_KEY)
    } catch {
      /* Storage may be blocked. */
    }
  }

  function open(input: {
    cookiebot: CookiebotApi | undefined
    pageView: PageViewContext
  }): JourneyPage | undefined {
    if (!hasCookiebotStatisticsConsent(input.cookiebot)) {
      revoke()
      return undefined
    }
    const consent = {
      ...getConsentSnapshot(input.cookiebot?.consent),
      analytics: 'granted' as const
    }
    const context = dependencies.enrich({
      consent,
      page_view_id: input.pageView.pageViewId
    })
    if (!context.journey_id) return undefined
    const url = new URL(input.pageView.pageUrl)
    const pagePath = sanitizeJourneyPath(url.pathname)
    if (!pagePath) return undefined
    const utmInput: Record<string, string> = {}
    for (const name of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term'
    ]) {
      const values = url.searchParams.getAll(name)
      if (
        values.length === 1 &&
        values[0] &&
        journeyUtmSchema.safeParse({ [name]: values[0] }).success
      )
        utmInput[name] = values[0]
    }
    const utm = journeyUtmSchema.safeParse(utmInput)
    const qualifies =
      pagePath === '/skreddersy-varmen' && utm.success
    if (!cohortId) {
      try {
        cohortId =
          dependencies.getStorage()?.getItem(COHORT_KEY) ??
          undefined
      } catch {
        /* In-memory fallback. */
      }
    }
    if (cohortId !== context.journey_id) {
      pages.clear()
      lastPageViewId = undefined
      cohortId = undefined
      if (!qualifies) return undefined
      cohortId = context.journey_id
      try {
        dependencies.getStorage()?.setItem(COHORT_KEY, cohortId)
      } catch {
        /* In-memory fallback. */
      }
    }
    const existing = pages.get(input.pageView.pageViewId)
    if (existing) {
      existing.consent = consent
      return existing
    }
    const page: JourneyPage = {
      journeyId: cohortId,
      pageViewId: input.pageView.pageViewId,
      ...(lastPageViewId ?
        { previousPageViewId: lastPageViewId }
      : {}),
      pagePath,
      consent,
      arrived: false,
      landingRecorded: false,
      ...(qualifies && utm.success ? { utm: utm.data } : {}),
      sections: new Set(),
      maxScrollY: 0,
      maxScrollPercent: 0,
      documentHeight: 1,
      viewportHeight: 1,
      progressSignature: '',
      lastProgressAt: 0
    }
    pages.set(page.pageViewId, page)
    lastPageViewId = page.pageViewId
    if (pages.size > 64) {
      const oldest = pages.keys().next().value
      if (oldest) pages.delete(oldest)
    }
    return page
  }
  return { open, revoke }
}
