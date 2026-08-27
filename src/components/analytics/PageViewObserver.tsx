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

      const consent = getConsentSnapshot(cookiebot?.consent)

      if (consent.marketing === 'granted') {
        resolveCampaignAttribution(landingPageUrl)
        const externalId =
          browserFirstPartyExternalIdStore.getOrCreate(consent)
        const pageView = currentPageView.current

        if (externalId) {
          browserMicrosoftUetIdSyncEmitter.emit({
            externalId,
            ...(pageView ?
              {
                pageViewEventId: pageView.event.event_id,
                pageViewId: pageView.event.page_view_id
              }
            : {})
          })
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
            const activePageView = currentPageView.current

            if (!activePageView || activePageView !== pageView) {
              return
            }

            const browserId = extractBrowserIds(
              document.cookie,
              consent
            )
            const clickId = extractClickIds(
              pageView.event.page_url,
              document.cookie,
              true
            )
            const releasedEvent =
              releaseCanonicalPageViewForConsent({
                event: pageView.event,
                consent,
                ...(browserId ? { browserId } : {}),
                ...(clickId ? { clickId } : {}),
                ...(externalId ? { externalId } : {})
              })

            pageView.event = releasedEvent
            emitCanonicalPageView(releasedEvent)
          }, 0)
        }
      }

      if (!landingCorrelation || !landingPageView) return

      void browserLandingConsentTransport.observe({
        consent,
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
    const clickId = extractClickIds(
      navigation.pageUrl,
      document.cookie,
      consent.marketing === 'granted'
    )
    const externalId =
      browserFirstPartyExternalIdStore.getOrCreate(consent)
    if (consent.marketing === 'granted') {
      resolveCampaignAttribution(navigation.pageUrl)
    }
    const searchParams = new URL(navigation.pageUrl).searchParams
    const impressionId =
      searchParams.get('impression_id') ??
      searchParams.get('impressionId') ??
      undefined
    const landingCorrelation = readBrowserLandingEdgeCorrelation(
      navigation.pageUrl
    )
    const edgeRequestId =
      landingCorrelation?.edgeRequestId ??
      readBrowserLandingEdgeRequestId(navigation.pageUrl)

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

    emitCanonicalPageView(event)

    if (externalId) {
      browserMicrosoftUetIdSyncEmitter.emit({
        externalId,
        pageViewEventId: event.event_id,
        pageViewId: event.page_view_id
      })
    }

    void browserPageViewCollectorTransport.queue(
      event,
      landingCorrelation
    )
  }, [environment, pathname, search])

  useEffect(() => {
    const rectsOverlap = (
      a: DOMRect | undefined,
      b: DOMRect | undefined
    ) =>
      Boolean(
        a &&
          b &&
          !(
            a.right < b.left ||
            a.left > b.right ||
            a.bottom < b.top ||
            a.top > b.bottom
          )
      )

    const reportCookiebotOverlay = () => {
      const dialog = document.getElementById('CybotCookiebotDialog')
      const sizeButton = [...document.querySelectorAll('button')].find(
        button => /Velg størrelse/.test(button.textContent || '')
      )
      const solutionButton = [...document.querySelectorAll('button')].find(
        button => /Se løsningen/.test(button.textContent || '')
      )
      const accept = document.getElementById(
        'CybotCookiebotDialogBodyButtonAccept'
      )
      const decline = document.getElementById(
        'CybotCookiebotDialogBodyButtonDecline'
      )
      const sticky = document.querySelector(
        '[class*="fixed"][class*="bottom-3"]'
      )
      const cookiebot = getCookiebotState()
      const dialogRect = dialog?.getBoundingClientRect()
      const sizeRect = sizeButton?.getBoundingClientRect()
      const solutionRect = solutionButton?.getBoundingClientRect()
      const acceptRect = accept?.getBoundingClientRect()
      const declineRect = decline?.getBoundingClientRect()
      const dialogStyle = dialog ? getComputedStyle(dialog) : null
      const compactMarker = getComputedStyle(document.documentElement)
        .getPropertyValue('--utekos-cookiebot-compact')
        .trim()

      // #region agent log
      fetch('http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0f682d'},body:JSON.stringify({sessionId:'0f682d',runId:'post-fix',hypothesisId:'A',location:'src/components/analytics/PageViewObserver.tsx:cookiebotCompactCoverage',message:'cookiebot compact coverage',data:{pathname,host:location.host,compactMarker,hasResponse:cookiebot?.hasResponse===true,dialogPresent:Boolean(dialog),dialogDisplay:dialogStyle?.display??null,dialogTransform:dialogStyle?.transform??null,dialogMaxHeight:dialogStyle?.maxHeight??null,dialogY:dialogRect?Math.round(dialogRect.y):null,dialogHeight:dialogRect?Math.round(dialogRect.height):0,sizeBottom:sizeRect?Math.round(sizeRect.bottom):null,solutionBottom:solutionRect?Math.round(solutionRect.bottom):null,coversSizeButton:rectsOverlap(dialogRect,sizeRect),coversSolutionButton:rectsOverlap(dialogRect,solutionRect),coversSticky:rectsOverlap(dialogRect,sticky?.getBoundingClientRect()),acceptVisible:Boolean(acceptRect&&acceptRect.height>0),declineVisible:Boolean(declineRect&&declineRect.height>0),viewportHeight:window.innerHeight,viewportWidth:window.innerWidth},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      const solutionBottom = solutionRect ? Math.round(solutionRect.bottom) : null
      const vh = window.innerHeight
      const banner14Top = vh - Math.min(vh * 0.28, 224)
      const banner18Top = vh - Math.min(vh * 0.36, 288)
      // #region agent log
      fetch('http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0f682d'},body:JSON.stringify({sessionId:'0f682d',runId:'post-fix',hypothesisId:'B',location:'src/components/analytics/PageViewObserver.tsx:cookiebotViewportSim',message:'cookiebot viewport simulation',data:{pathname,host:location.host,viewportHeight:vh,solutionBottom,wouldCover18:solutionBottom!=null&&solutionBottom>banner18Top,wouldCover14:solutionBottom!=null&&solutionBottom>banner14Top,banner14Top:Math.round(banner14Top),banner18Top:Math.round(banner18Top)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }

    reportCookiebotOverlay()
    window.addEventListener('CookiebotOnDialogDisplay', reportCookiebotOverlay)
    window.addEventListener('CookiebotOnAccept', reportCookiebotOverlay)
    window.addEventListener('CookiebotOnDecline', reportCookiebotOverlay)

    return () => {
      window.removeEventListener('CookiebotOnDialogDisplay', reportCookiebotOverlay)
      window.removeEventListener('CookiebotOnAccept', reportCookiebotOverlay)
      window.removeEventListener('CookiebotOnDecline', reportCookiebotOverlay)
    }
  }, [pathname])

  return null
}
