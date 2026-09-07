import {
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import { browserPageViewSession } from './pageViewSession'
import { browserFirstPartyExternalIdStore } from './firstPartyExternalId'
import type { LeadFormTrackingContext } from './leadFormTrackingContext'
import { LEAD_TRACKING_CONTEXT_FIELD } from './leadFormTrackingContext'
import { enrichCanonicalBrowserJourneyContext } from './internalJourneyContext'

type CookiebotWindow = Window & {
  Cookiebot?: {
    consent?: CookiebotConsent
    hasResponse?: boolean
  }
}

function readUtmParam(
  searchParams: URLSearchParams,
  name: string
): string | undefined {
  const value = searchParams.get(name)?.trim()
  return value && value.length > 0 ? value : undefined
}

export function collectLeadFormTrackingContext(): LeadFormTrackingContext {
  const pageUrl = window.location.href
  const cookiebot = (window as CookiebotWindow).Cookiebot
  const consent = getConsentSnapshot(
    cookiebot?.hasResponse === true ?
      cookiebot.consent
    : undefined
  )

  browserFirstPartyExternalIdStore.getOrCreate(consent)

  const pageView = browserPageViewSession.ensure({
    pageUrl,
    documentReferrer: document.referrer
  })

  const searchParams = new URL(pageUrl).searchParams
  const journey = enrichCanonicalBrowserJourneyContext<
    Pick<
      LeadFormTrackingContext,
      'consent' | 'page_view_id' | 'journey_id'
    >
  >({ consent, page_view_id: pageView.pageViewId })
  const campaign = readUtmParam(searchParams, 'utm_campaign')
  const medium = readUtmParam(searchParams, 'utm_medium')
  const content = readUtmParam(searchParams, 'utm_content')
  const term = readUtmParam(searchParams, 'utm_term')

  return {
    consent,
    page_url: pageUrl,
    ...(consent.analytics === 'granted' ?
      {
        page_view_id: pageView.pageViewId,
        ...(journey.journey_id ?
          { journey_id: journey.journey_id }
        : {})
      }
    : {}),
    ...(pageView.referrerUrl ?
      { referrer_url: pageView.referrerUrl }
    : document.referrer.startsWith('http') ?
      { referrer_url: document.referrer }
    : {}),
    cookie_header: document.cookie.slice(0, 4096),
    ...(campaign ? { campaign } : {}),
    ...(medium ? { medium } : {}),
    ...(content ? { content } : {}),
    ...(term ? { term } : {})
  }
}

export function appendLeadTrackingContext(
  formData: FormData
): void {
  formData.set(
    LEAD_TRACKING_CONTEXT_FIELD,
    JSON.stringify(collectLeadFormTrackingContext())
  )
}
