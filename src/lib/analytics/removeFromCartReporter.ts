'use client'

import { sendGTMEvent } from '@next/third-parties/google'

import { readBrowserReporterContext } from './browserReporterContext'
import {
  buildRemoveFromCartDataLayerEvent,
  createCanonicalRemoveFromCart,
  type CanonicalRemoveFromCart,
  type CanonicalRemoveFromCartCustomData
} from './removeFromCartEvent'
import { browserPageViewSession } from './pageViewSession'
import { startRemoveFromCartCollectorTransport } from './removeFromCartCollectorTransport'

export type ReportCanonicalRemoveFromCartInput = {
  customData: CanonicalRemoveFromCartCustomData
  pageViewId?: string
}

export function reportCanonicalRemoveFromCart(
  input: ReportCanonicalRemoveFromCartInput
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  try {
    const clientContext = readBrowserReporterContext()

    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })

    const event = createCanonicalRemoveFromCart({
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

    sendGTMEvent(buildRemoveFromCartDataLayerEvent(event))

    return startRemoveFromCartCollectorTransport(event)
  } catch (error) {
    console.error(
      '[remove-from-cart] Canonical reporting failed',
      {
        errorName:
          error instanceof Error ? error.name : 'UnknownError'
      }
    )

    return () => {}
  }
}

export type { CanonicalRemoveFromCart }
