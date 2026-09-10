'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import {
  buildViewCartDataLayerEvent,
  createCanonicalViewCart,
  type CanonicalViewCart,
  type CanonicalViewCartCustomData
} from './viewCartEvent'
import { startViewCartCollectorTransport } from './viewCartCollectorTransport'

export type ReportCanonicalViewCartInput = {
  customData: CanonicalViewCartCustomData
  pageViewId?: string
}

export function reportCanonicalViewCart(
  input: ReportCanonicalViewCartInput
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  try {
    const clientContext = readBrowserReporterContext()
    // #region agent log
    fetch(
      'http://127.0.0.1:7626/ingest/3d726327-2da6-4157-aa0a-bb33dbbbefd1',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '2aed25'
        },
        body: JSON.stringify({
          sessionId: '2aed25',
          runId: 'pre-fix',
          hypothesisId: 'H5',
          location: 'viewCartReporter.ts:context',
          message: 'view_cart reporter context',
          data: {
            hasContext: Boolean(clientContext),
            itemCount: input.customData.items.length,
            analytics: clientContext?.consent.analytics ?? null,
            marketing: clientContext?.consent.marketing ?? null,
            hasFbc: Boolean(clientContext?.browserId?.fbc)
          },
          timestamp: Date.now()
        })
      }
    ).catch(() => {})
    // #endregion
    if (!clientContext) return () => {}
    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })

    const event = createCanonicalViewCart({
      environment: clientContext.environment,
      eventId: globalThis.crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      pageUrl: clientContext.pageUrl,
      pageTitle: clientContext.pageTitle,
      pageViewId: input.pageViewId ?? pageView.pageViewId,
      ...(pageView.referrerUrl ?
        { referrerUrl: pageView.referrerUrl }
      : {}),
      consent: clientContext.consent,
      customData: input.customData,
      ...(clientContext.browserId ?
        { browserId: clientContext.browserId }
      : {}),
      ...(clientContext.clickId ?
        { clickId: clientContext.clickId }
      : {}),
      ...(clientContext.externalId ?
        { externalId: clientContext.externalId }
      : {}),
      eventDeviceInfo: clientContext.eventDeviceInfo
    })

    sendGTMEvent(buildViewCartDataLayerEvent(event))
    return startViewCartCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export type { CanonicalViewCart }
