'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'
import { enrichCanonicalBrowserJourneyContext } from '@/lib/analytics/internalJourneyContext'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotStatisticsConsent,
  hasCookiebotMarketingConsent
} from '@/lib/consent/cookiebotConsent'
import type { CookiebotApi } from '@/lib/consent/cookiebotConsent'
import { createJourneySession } from '@/lib/observability/journey/createJourneySession'
import { createJourneyTransport } from '@/lib/observability/journey/createJourneyTransport'
import { observeJourneyPage } from '@/lib/observability/journey/observeJourneyPage'
import type { JourneyEvent } from '@/lib/observability/journey/contract'

const session = createJourneySession({
  enrich: enrichCanonicalBrowserJourneyContext,
  getStorage: () => window.sessionStorage
})
const getCookiebot = () =>
  (window as Window & { Cookiebot?: CookiebotApi }).Cookiebot
const allowed = () =>
  hasCookiebotStatisticsConsent(getCookiebot()) &&
  hasCookiebotMarketingConsent(getCookiebot()) &&
  !(window as Window & { __utekosConsentReloading?: boolean })
    .__utekosConsentReloading
const transport = createJourneyTransport({
  fetch: (...args) => fetch(...args),
  allowed
})
let hadAnalyticsConsent = false
let backForwardUrl: string | undefined

export function JourneyObserver({
  environment
}: {
  environment: JourneyEvent['environment']
}) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    function backForward() {
      backForwardUrl =
        allowed() ? window.location.href : undefined
    }
    // Keep this listener through route cleanup during Next's popstate handler.
    window.addEventListener('popstate', backForward, true)
    return () => {
      window.removeEventListener('popstate', backForward, true)
      backForwardUrl = undefined
    }
  }, [])

  useEffect(() => {
    let stop: ReturnType<typeof observeJourneyPage> | undefined
    function reconcile() {
      if (!allowed()) {
        stop?.('consent')
        stop = undefined
        if (hadAnalyticsConsent) session.revoke()
        hadAnalyticsConsent = false
        backForwardUrl = undefined
        transport.revoke()
        return
      }
      hadAnalyticsConsent = true
      stop?.('consent')
      stop = undefined
      if (document.visibilityState !== 'visible') return
      try {
        const page = session.open({
          cookiebot: getCookiebot(),
          pageView: browserPageViewSession.ensure({
            pageUrl: window.location.href,
            documentReferrer: document.referrer
          })
        })
        if (page)
          stop = observeJourneyPage({
            page,
            environment,
            send: transport.send,
            allowed,
            ...(backForwardUrl === window.location.href ?
              { navigationType: 'back_forward' as const }
            : {})
          })
        backForwardUrl = undefined
      } catch {
        /* Observability must not interrupt commerce. */
      }
    }
    function resume() {
      if (!stop && document.visibilityState === 'visible')
        reconcile()
    }
    // Let all popstate listeners finish before classifying the new arrival.
    const initialReconcile = window.setTimeout(reconcile, 0)
    for (const event of COOKIEBOT_CONSENT_EVENTS)
      window.addEventListener(event, reconcile)
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.clearTimeout(initialReconcile)
      stop?.('navigation')
      for (const event of COOKIEBOT_CONSENT_EVENTS)
        window.removeEventListener(event, reconcile)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [environment, pathname, search])
  return null
}
