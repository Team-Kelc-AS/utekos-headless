'use client'

import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import {
  buildScrollDepthDataLayerEvent,
  createCanonicalScrollDepth,
  type CanonicalScrollDepth,
  type CanonicalScrollDepthCustomData
} from './scrollDepthEvent'
import { startScrollDepthCollectorTransport } from './scrollDepthCollectorTransport'

export type ReportCanonicalScrollDepthInput = {
  customData: CanonicalScrollDepthCustomData
  pageViewId?: string
}

export function reportCanonicalScrollDepth(
  input: ReportCanonicalScrollDepthInput
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  try {
    const clientContext = readBrowserReporterContext()
    if (!clientContext) return () => {}
    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })

    const event = createCanonicalScrollDepth({
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

    sendGTMEvent(buildScrollDepthDataLayerEvent(event))
    return startScrollDepthCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export type { CanonicalScrollDepth }
