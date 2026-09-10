'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import { mapShopifyAddToWishlist } from './shopifyAddToWishlistCommerce'
import {
  buildAddToWishlistDataLayerEvent,
  createCanonicalAddToWishlist,
  type CanonicalAddToWishlist
} from './addToWishlistEvent'
import { startAddToWishlistCollectorTransport } from './addToWishlistCollectorTransport'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type ReportCanonicalAddToWishlistInput = {
  pageViewId?: string
  product: ProductCommerceModel
  quantity?: number
  variant: ProductPurchaseVariant
  wishlistMutationId: string
}

export function reportCanonicalAddToWishlist(
  input: ReportCanonicalAddToWishlistInput
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
          hypothesisId: 'H1',
          location: 'addToWishlistReporter.ts:context',
          message: 'wishlist reporter context',
          data: {
            hasContext: Boolean(clientContext),
            analytics: clientContext?.consent.analytics ?? null,
            marketing: clientContext?.consent.marketing ?? null,
            hasFbc: Boolean(clientContext?.browserId?.fbc),
            hasFbclid: Boolean(clientContext?.clickId?.fbclid)
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

    const customData = mapShopifyAddToWishlist({
      product: input.product,
      variant: input.variant,
      wishlistMutationId: input.wishlistMutationId,
      ...(input.quantity !== undefined ?
        { quantity: input.quantity }
      : {})
    })

    const event = createCanonicalAddToWishlist({
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

    sendGTMEvent(buildAddToWishlistDataLayerEvent(event))
    return startAddToWishlistCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export type { CanonicalAddToWishlist }
