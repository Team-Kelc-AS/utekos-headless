import {
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import { browserPageViewSession } from './pageViewSession'
import { browserFirstPartyExternalIdStore } from './firstPartyExternalId'
import type { LeadFormTrackingContext } from './leadFormTrackingContext'
import { LEAD_TRACKING_CONTEXT_FIELD } from './leadFormTrackingContext'
import { enrichCanonicalBrowserJourneyContext } from './internalJourneyContext'
import { hasCookiebotExplicitResponse } from '@/lib/consent/cookiebotConsent'
import { withoutTrackingQuery } from './withoutTrackingQuery'

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
    hasCookiebotExplicitResponse(cookiebot) ?
      cookiebot?.consent
    : undefined
  )

  if (
    consent.analytics !== 'granted' &&
    consent.marketing !== 'granted'
  ) {
    return { consent, page_url: withoutTrackingQuery(pageUrl) }
  }

  browserFirstPartyExternalIdStore.getOrCreate(consent)

  const pageView = browserPageViewSession.ensure({
    pageUrl:
      consent.marketing === 'granted' ?
        pageUrl
      : withoutTrackingQuery(pageUrl),
    documentReferrer:
      consent.marketing === 'granted' ?
        document.referrer
      : withoutTrackingQuery(document.referrer)
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
    page_url:
      consent.marketing === 'granted' ?
        pageUrl
      : withoutTrackingQuery(pageUrl),
    ...(consent.analytics === 'granted' ?
      {
        page_view_id: pageView.pageViewId,
        ...(journey.journey_id ?
          { journey_id: journey.journey_id }
        : {})
      }
    : {}),
    ...(pageView.referrerUrl ?
      {
        referrer_url:
          consent.marketing === 'granted' ?
            pageView.referrerUrl
          : withoutTrackingQuery(pageView.referrerUrl)
      }
    : document.referrer.startsWith('http') ?
      {
        referrer_url:
          consent.marketing === 'granted' ?
            document.referrer
          : withoutTrackingQuery(document.referrer)
      }
    : {}),
    ...(consent.marketing === 'granted' ?
      {
        cookie_header: document.cookie
          .split(';')
          .filter(part =>
            /^\s*(?:_fbp|_fbc|_scid|_uetmsclkid|_uetsid|_uetvid|_gcl_au|utekos_external_id)=/.test(
              part
            )
          )
          .join(';')
          .slice(0, 4096)
      }
    : {}),
    ...(consent.marketing === 'granted' && campaign ?
      { campaign }
    : {}),
    ...(consent.marketing === 'granted' && medium ?
      { medium }
    : {}),
    ...(consent.marketing === 'granted' && content ?
      { content }
    : {}),
    ...(consent.marketing === 'granted' && term ? { term } : {})
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
