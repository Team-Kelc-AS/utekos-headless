'use client'

import { sendGTMEvent } from '@next/third-parties/google'

import { readBrowserReporterContext } from './browserReporterContext'
import {
  buildRemoveFromCartDataLayerEvent,
  createCanonicalRemoveFromCart,
  type CanonicalRemoveFromCart,
  type CanonicalRemoveFromCartCustomData
} from './removeFromCartEvent'
import type { RemoveFromCartPageContext } from './removeFromCartPageContext'
import { startRemoveFromCartCollectorTransport } from './removeFromCartCollectorTransport'

export type ReportCanonicalRemoveFromCartInput = {
  customData: CanonicalRemoveFromCartCustomData
  pageContext: RemoveFromCartPageContext | undefined
}

export function reportCanonicalRemoveFromCart(
  input: ReportCanonicalRemoveFromCartInput
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  if (!input.pageContext) {
    console.error(
      '[remove-from-cart] Canonical reporting skipped',
      { reason: 'missing_action_page_context' }
    )
    return () => {}
  }

  try {
    const pageView = input.pageContext
    // Read current consent, but attribute the confirmed mutation to its action page.
    const clientContext = readBrowserReporterContext(
      pageView.pageUrl
    )
    if (!clientContext) return () => {}

    const event = createCanonicalRemoveFromCart({
      environment: clientContext.environment,
      eventId: globalThis.crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      pageUrl: clientContext.pageUrl,
      pageTitle: pageView.pageTitle,
      pageViewId: pageView.pageViewId,
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
