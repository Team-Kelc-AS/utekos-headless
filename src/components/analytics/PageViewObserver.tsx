'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { readBrowserReporterContext } from '@/lib/analytics/browserReporterContext'
import { emitCanonicalPageView } from '@/lib/analytics/emitCanonicalPageView'
import { browserMicrosoftUetIdSyncEmitter } from '@/lib/analytics/emitMicrosoftUetIdSync'
import { browserPageViewCollectorTransport } from '@/lib/analytics/pageViewCollectorTransport'
import {
  createCanonicalPageView,
  type TrackingEnvironment
} from '@/lib/analytics/pageViewEvent'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'
import { subscribeToCookiebotPageViewUpdates } from '@/lib/analytics/subscribeToCookiebotPageViewUpdates'
import { runConsentStep } from '@/lib/analytics/runConsentStep'

export function PageViewObserver({
  environment
}: {
  environment: TrackingEnvironment
}) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    const observeConsent = () => {
      const context = readBrowserReporterContext()
      if (!context) {
        browserPageViewSession.clear()
        browserPageViewCollectorTransport.clear()
        return
      }
      const pageView = browserPageViewSession.ensure({
        pageUrl: context.pageUrl,
        ...(context.documentReferrer ?
          { documentReferrer: context.documentReferrer }
        : {})
      })
      if (browserPageViewSession.hasEmitted(pageView.pageViewId))
        return
      const event = createCanonicalPageView({
        environment,
        eventId: crypto.randomUUID(),
        pageViewId: pageView.pageViewId,
        eventTime: new Date().toISOString(),
        pageUrl: context.pageUrl,
        pageTitle: context.pageTitle,
        ...(context.documentReferrer ?
          { referrerUrl: context.documentReferrer }
        : {}),
        consent: context.consent,
        ...(context.browserId ?
          { browserId: context.browserId }
        : {}),
        ...(context.clickId ? { clickId: context.clickId } : {}),
        ...(context.externalId ?
          { externalId: context.externalId }
        : {}),
        eventDeviceInfo: context.eventDeviceInfo
      })
      emitCanonicalPageView(event)
      if (context.externalId) {
        browserMicrosoftUetIdSyncEmitter.emit({
          externalId: context.externalId,
          pageViewEventId: event.event_id,
          pageViewId: event.page_view_id
        })
      }
      void browserPageViewCollectorTransport.queue(event)
    }
    const unsubscribe = subscribeToCookiebotPageViewUpdates({
      eventTarget: window,
      documentTarget: document,
      isVisible: () => document.visibilityState === 'visible',
      flush: () => browserPageViewCollectorTransport.flush(),
      observeConsent
    })
    runConsentStep(observeConsent, 'consent_processing_failed')
    return unsubscribe
  }, [environment, pathname, search])
  return null
}
