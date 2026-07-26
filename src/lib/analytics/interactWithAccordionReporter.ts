'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { readBrowserReporterContext } from './browserReporterContext'
import {
  buildInteractWithAccordionDataLayerEvent,
  createCanonicalInteractWithAccordion,
  type CanonicalInteractWithAccordionCustomData
} from './interactWithAccordionEvent'
import { startInteractWithAccordionCollectorTransport } from './interactWithAccordionCollectorTransport'
import { browserPageViewSession } from './pageViewSession'

export function reportCanonicalInteractWithAccordion(
  customData: CanonicalInteractWithAccordionCustomData
): () => void {
  if (typeof window === 'undefined') return () => {}

  try {
    const clientContext = readBrowserReporterContext()
    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })
    const event = createCanonicalInteractWithAccordion({
      environment: clientContext.environment,
      eventId: globalThis.crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      pageTitle: clientContext.pageTitle,
      pageUrl: clientContext.pageUrl,
      pageViewId: pageView.pageViewId,
      ...(pageView.referrerUrl ?
        { referrerUrl: pageView.referrerUrl }
      : {}),
      consent: clientContext.consent,
      customData,
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

    sendGTMEvent(buildInteractWithAccordionDataLayerEvent(event))
    return startInteractWithAccordionCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}
