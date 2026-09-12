'use client'

import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import {
  buildHeroInteractDataLayerEvent,
  createCanonicalHeroInteract,
  type CanonicalHeroInteract,
  type CanonicalHeroInteractCustomData
} from './heroInteractEvent'
import { startHeroInteractCollectorTransport } from './heroInteractCollectorTransport'

export type ReportCanonicalHeroInteractInput = {
  customData: CanonicalHeroInteractCustomData
  pageViewId?: string
}

export function reportCanonicalHeroInteract(
  input: ReportCanonicalHeroInteractInput
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

    const event = createCanonicalHeroInteract({
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

    sendGTMEvent(buildHeroInteractDataLayerEvent(event))
    return startHeroInteractCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export type { CanonicalHeroInteract }
