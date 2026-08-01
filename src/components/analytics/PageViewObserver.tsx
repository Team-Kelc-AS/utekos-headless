'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { claimPageViewNavigation } from '@/lib/analytics/claimPageViewNavigation'
import { emitCanonicalPageView } from '@/lib/analytics/emitCanonicalPageView'
import {
  extractBrowserIds,
  extractClickIds,
  getConsentSnapshot
} from '@/lib/analytics/pageViewClientContext'
import { browserFirstPartyExternalIdStore } from '@/lib/analytics/firstPartyExternalId'
import {
  readBrowserLandingEdgeCorrelation,
  readBrowserLandingEdgeRequestId
} from '@/lib/analytics/landingEdgeCorrelation'
import { browserLandingConsentTransport } from '@/lib/analytics/landingConsentObservation'
import {
  browserPageViewCollectorTransport,
  hasCookiebotDecision,
  type CookiebotState
} from '@/lib/analytics/pageViewCollectorTransport'
import {
  createCanonicalPageView,
  type TrackingEnvironment
} from '@/lib/analytics/pageViewEvent'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'
import { subscribeToCookiebotPageViewUpdates } from '@/lib/analytics/subscribeToCookiebotPageViewUpdates'

type PageViewObserverProps = { environment: TrackingEnvironment }

type CookiebotWindow = Window & { Cookiebot?: CookiebotState }

function getCookiebotState() {
  return (window as CookiebotWindow).Cookiebot
}

export function PageViewObserver({
  environment
}: PageViewObserverProps) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    const landingPageUrl = window.location.href
    const landingDocumentReferrer = document.referrer
    const landingCorrelation =
      readBrowserLandingEdgeCorrelation(landingPageUrl)
    const landingPageView =
      landingCorrelation ?
        browserPageViewSession.ensure({
          pageUrl: landingPageUrl,
          ...(landingDocumentReferrer ?
            { documentReferrer: landingDocumentReferrer }
          : {})
        })
      : undefined

    const observeConsent = () => {
      const cookiebot = getCookiebotState()
      if (!hasCookiebotDecision(cookiebot)) return
      if (!landingCorrelation || !landingPageView) return

      void browserLandingConsentTransport.observe({
        consent: getConsentSnapshot(cookiebot?.consent),
        correlation_token: landingCorrelation.token,
        edge_request_id: landingCorrelation.edgeRequestId,
        page_view_id: landingPageView.pageViewId
      })
    }

    const unsubscribe = subscribeToCookiebotPageViewUpdates({
      eventTarget: window,
      flush: () => browserPageViewCollectorTransport.flush(),
      observeConsent
    })

    observeConsent()
    void browserPageViewCollectorTransport.flush()

    return unsubscribe
  }, [])

  useEffect(() => {
    const navigation = claimPageViewNavigation({
      currentUrl: window.location.href,
      documentReferrer: document.referrer
    })
    if (!navigation) return

    const pageView = browserPageViewSession.ensure({
      pageUrl: navigation.pageUrl,
      ...(navigation.referrerUrl ?
        { documentReferrer: navigation.referrerUrl }
      : {})
    })

    if (browserPageViewSession.hasEmitted(pageView.pageViewId)) {
      return
    }

    const consent = getConsentSnapshot(
      getCookiebotState()?.consent
    )
    const browserId = extractBrowserIds(document.cookie, consent)
    const clickId = extractClickIds(navigation.pageUrl)
    const externalId =
      browserFirstPartyExternalIdStore.getOrCreate(consent)
    const searchParams = new URL(navigation.pageUrl).searchParams
    const impressionId =
      searchParams.get('impression_id') ??
      searchParams.get('impressionId') ??
      undefined
    const edgeRequestId = readBrowserLandingEdgeRequestId(
      navigation.pageUrl
    )

    const event = createCanonicalPageView({
      environment,
      eventId: crypto.randomUUID(),
      ...(edgeRequestId ? { edgeRequestId } : {}),
      pageViewId: pageView.pageViewId,
      eventTime: new Date().toISOString(),
      pageUrl: navigation.pageUrl,
      ...(navigation.referrerUrl ?
        { referrerUrl: navigation.referrerUrl }
      : {}),
      pageTitle: document.title || 'Utekos',
      consent,
      ...(browserId ? { browserId } : {}),
      ...(clickId ? { clickId } : {}),
      ...(externalId ? { externalId } : {}),
      ...(impressionId ? { impressionId } : {}),
      eventDeviceInfo: {
        language: navigator.language,
        pixelRatio: window.devicePixelRatio,
        platform: navigator.platform,
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
        userAgent: navigator.userAgent,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth
      }
    })

    emitCanonicalPageView(event)
    void browserPageViewCollectorTransport.queue(event)
  }, [environment, pathname, search])

  return null
}
