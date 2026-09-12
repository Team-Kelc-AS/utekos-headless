import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotMarketingConsent,
  hasCookiebotStatisticsConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import { createMetaAudienceSessionStore } from './metaAudienceSessionStore'
import type { MetaAudience } from './metaAudience'

const store = createMetaAudienceSessionStore(() =>
  typeof window === 'undefined' ? undefined : (
    window.sessionStorage
  )
)
let listening = false
function allowed() {
  if (typeof window === 'undefined') return false
  const host = window as Window & {
    Cookiebot?: CookiebotApi
    __utekosConsentReloading?: boolean
  }
  return (
    !host.__utekosConsentReloading &&
    hasCookiebotStatisticsConsent(host.Cookiebot) &&
    hasCookiebotMarketingConsent(host.Cookiebot)
  )
}
export function readBrowserMetaAudience(
  consent: ConsentSnapshot
): MetaAudience | undefined {
  if (typeof window === 'undefined') return undefined
  if (!listening) {
    for (const event of COOKIEBOT_CONSENT_EVENTS)
      window.addEventListener(event, () => {
        if (!allowed()) store.clear()
      })
    listening = true
  }
  return store.resolve(
    window.location.href,
    allowed() &&
      consent.analytics === 'granted' &&
      consent.marketing === 'granted'
  )
}
export function enrichBrowserMetaAudience<
  E extends {
    consent: ConsentSnapshot
    page_url?: string | undefined
  }
>(event: E): E & { meta_audience?: MetaAudience | undefined } {
  const next: E & { meta_audience?: MetaAudience | undefined } =
    { ...event }
  delete next.meta_audience
  // A delayed event from an earlier page must not inherit a later ad entry.
  if (typeof window !== 'undefined' && event.page_url) {
    try {
      const page = new URL(event.page_url)
      const current = new URL(window.location.href)
      if (
        page.origin !== current.origin ||
        page.pathname !== current.pathname
      )
        return next
    } catch {
      return next
    }
  }
  const audience = readBrowserMetaAudience(event.consent)
  if (audience) next.meta_audience = audience
  return next
}
