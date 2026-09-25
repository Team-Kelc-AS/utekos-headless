'use client'

import { useEffect, useEffectEvent } from 'react'
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
import { runConsentStep } from '@/lib/analytics/runConsentStep'

export function PageViewObserver({
  environment,
  metaOnly = false
}: {
  environment: TrackingEnvironment
  metaOnly?: boolean
}) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  const emitPageView = useEffectEvent(
    (_pathname: string, _search: string) => {
      const observeConsent = () => {
        const context = readBrowserReporterContext(undefined, {
          includeViewport: false
        })
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
        if (
          browserPageViewSession.hasEmitted(pageView.pageViewId)
        )
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
          ...(context.clickId ?
            { clickId: context.clickId }
          : {}),
          ...(context.externalId ?
            { externalId: context.externalId }
          : {}),
          eventDeviceInfo: context.eventDeviceInfo
        })
        emitCanonicalPageView(event, metaOnly)
        if (context.externalId && !metaOnly) {
          browserMicrosoftUetIdSyncEmitter.emit({
            externalId: context.externalId,
            pageViewEventId: event.event_id,
            pageViewId: event.page_view_id
          })
        }
        void browserPageViewCollectorTransport.queue(event)
      }
      runConsentStep(observeConsent, 'consent_processing_failed')
    }
  )

  useEffect(() => {
    emitPageView(pathname, search)
  }, [pathname, search])
  return null
}
