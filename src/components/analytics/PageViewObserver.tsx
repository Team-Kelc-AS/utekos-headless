'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { claimPageViewNavigation } from '@/lib/analytics/claimPageViewNavigation'
import { emitCanonicalPageView } from '@/lib/analytics/emitCanonicalPageView'
import { browserMicrosoftUetIdSyncEmitter } from '@/lib/analytics/emitMicrosoftUetIdSync'
import {
  extractBrowserIds,
  extractClickIds,
  getConsentSnapshot
} from '@/lib/analytics/pageViewClientContext'
import { browserFirstPartyExternalIdStore } from '@/lib/analytics/firstPartyExternalId'
import { resolveCampaignAttribution } from '@/lib/analytics/campaignAttributionSessionStore'
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
  releaseCanonicalPageViewForConsent,
  shouldReleaseCanonicalPageViewForConsent,
  type CanonicalPageView,
  type TrackingEnvironment
} from '@/lib/analytics/pageViewEvent'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'
import { subscribeToCookiebotPageViewUpdates } from '@/lib/analytics/subscribeToCookiebotPageViewUpdates'
import { runConsentStep } from '@/lib/analytics/runConsentStep'
import { reportConsentDiagnostic } from '@/lib/observability/client/reportConsentDiagnostic'

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
  const currentPageView = useRef<{
    event: CanonicalPageView
    marketingReleaseScheduled: boolean
  } | null>(null)

  useEffect(() => {
    let disposed = false
    const landingPageUrl = window.location.href
    const landingDocumentReferrer = document.referrer
    const landingCorrelation = runConsentStep(() =>
      readBrowserLandingEdgeCorrelation(landingPageUrl)
    )
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

      const consent = getConsentSnapshot(cookiebot?.consent)
      reportConsentDiagnostic('decision_observed')

      if (landingCorrelation && landingPageView) {
        runConsentStep(() => {
          void browserLandingConsentTransport
            .observe({
              consent,
              correlation_token: landingCorrelation.token,
              edge_request_id: landingCorrelation.edgeRequestId,
              page_view_id: landingPageView.pageViewId
            })
            .then(result => {
              if (result === 'sent')
                reportConsentDiagnostic('observation_sent')
              if (result === 'failed')
                reportConsentDiagnostic('observation_failed')
            })
            .catch(() =>
              reportConsentDiagnostic('observation_failed')
            )
        }, 'observation_failed')
      }

      if (consent.marketing === 'granted') {
        runConsentStep(() =>
          resolveCampaignAttribution(landingPageUrl)
        )
        const externalId = runConsentStep(() =>
          browserFirstPartyExternalIdStore.getOrCreate(consent)
        )
        const pageView = currentPageView.current

        if (externalId) {
          runConsentStep(() =>
            browserMicrosoftUetIdSyncEmitter.emit({
              externalId,
              ...(pageView ?
                {
                  pageViewEventId: pageView.event.event_id,
                  pageViewId: pageView.event.page_view_id
                }
              : {})
            })
          )
        }

        if (
          pageView &&
          !pageView.marketingReleaseScheduled &&
          shouldReleaseCanonicalPageViewForConsent({
            event: pageView.event,
            consent
          })
        ) {
          pageView.marketingReleaseScheduled = true

          window.setTimeout(() => {
            pageView.marketingReleaseScheduled = false
            const activePageView = currentPageView.current
            const latestCookiebot = getCookiebotState()
            const latestConsent = getConsentSnapshot(
              latestCookiebot?.consent
            )

            if (
              disposed ||
              !activePageView ||
              activePageView !== pageView ||
              !hasCookiebotDecision(latestCookiebot) ||
              latestConsent.marketing !== 'granted'
            ) {
              return
            }

            const cookieHeader =
              runConsentStep(() => document.cookie) ?? ''
            const browserId = runConsentStep(() =>
              extractBrowserIds(cookieHeader, latestConsent)
            )
            const clickId = runConsentStep(() =>
              extractClickIds(
                pageView.event.page_url,
                cookieHeader,
                true
              )
            )
            const releasedEvent =
              releaseCanonicalPageViewForConsent({
                event: pageView.event,
                consent: latestConsent,
                ...(browserId ? { browserId } : {}),
                ...(clickId ? { clickId } : {}),
                ...(externalId ? { externalId } : {})
              })

            runConsentStep(() => {
              emitCanonicalPageView(releasedEvent)
              pageView.event = releasedEvent
            }, 'consent_processing_failed')
          }, 0)
        }
      }
    }

    const unsubscribe = subscribeToCookiebotPageViewUpdates({
      eventTarget: window,
      documentTarget: document,
      isVisible: () => document.visibilityState === 'visible',
      flush: () => browserPageViewCollectorTransport.flush(),
      observeConsent
    })

    runConsentStep(observeConsent, 'consent_processing_failed')

    return () => {
      disposed = true
      unsubscribe()
    }
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

    const cookiebot = getCookiebotState()
    const consent = getConsentSnapshot(
      hasCookiebotDecision(cookiebot) ?
        cookiebot?.consent
      : undefined
    )
    const cookieHeader =
      runConsentStep(() => document.cookie) ?? ''
    const browserId = runConsentStep(() =>
      extractBrowserIds(cookieHeader, consent)
    )
    const clickId = runConsentStep(() =>
      extractClickIds(
        navigation.pageUrl,
        cookieHeader,
        consent.marketing === 'granted'
      )
    )
    const externalId = runConsentStep(() =>
      browserFirstPartyExternalIdStore.getOrCreate(consent)
    )
    if (consent.marketing === 'granted') {
      runConsentStep(() =>
        resolveCampaignAttribution(navigation.pageUrl)
      )
    }
    const searchParams = new URL(navigation.pageUrl).searchParams
    const impressionId =
      searchParams.get('impression_id') ??
      searchParams.get('impressionId') ??
      undefined
    const landingCorrelation = runConsentStep(() =>
      readBrowserLandingEdgeCorrelation(navigation.pageUrl)
    )
    const edgeRequestId =
      landingCorrelation?.edgeRequestId ??
      runConsentStep(() =>
        readBrowserLandingEdgeRequestId(navigation.pageUrl)
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

    currentPageView.current = {
      event,
      marketingReleaseScheduled: false
    }

    runConsentStep(
      () => emitCanonicalPageView(event),
      'consent_processing_failed'
    )

    if (externalId) {
      runConsentStep(() =>
        browserMicrosoftUetIdSyncEmitter.emit({
          externalId,
          pageViewEventId: event.event_id,
          pageViewId: event.page_view_id
        })
      )
    }

    void browserPageViewCollectorTransport
      .queue(event, landingCorrelation)
      .then(result => {
        if (result === 'failed')
          reportConsentDiagnostic('collector_failed')
        if (result === 'sent')
          reportConsentDiagnostic('collector_sent')
      })
      .catch(() => reportConsentDiagnostic('collector_failed'))
  }, [environment, pathname, search])

  return null
}
