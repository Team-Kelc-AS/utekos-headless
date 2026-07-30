'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import {
  buildAddToCartDataLayerEvent,
  createCanonicalAddToCart
} from './addToCartEvent'
import { startAddToCartCollectorTransport } from './addToCartCollectorTransport'
import { mapShopifyAddToCart } from './shopifyAddToCartCommerce'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type ReportCanonicalAddToCartInput = {
  cartId: string
  cartUpdatedAt?: string
  product: ProductCommerceModel
  quantity: number
  variant: ProductPurchaseVariant
}

export function reportCanonicalAddToCart(
  input: ReportCanonicalAddToCartInput
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

    const eventTime = new Date().toISOString()
    const commerce = mapShopifyAddToCart({
      cartId: input.cartId,
      ...(input.cartUpdatedAt ?
        { cartUpdatedAt: input.cartUpdatedAt }
      : {}),
      mutationTimestamp: eventTime,
      product: input.product,
      quantity: input.quantity,
      variant: input.variant
    })

    const event = createCanonicalAddToCart({
      environment: clientContext.environment,
      eventId: globalThis.crypto.randomUUID(),
      eventTime,
      pageUrl: clientContext.pageUrl,
      pageTitle: clientContext.pageTitle,
      pageViewId: pageView.pageViewId,
      ...(pageView.referrerUrl ?
        { referrerUrl: pageView.referrerUrl }
      : {}),
      consent: clientContext.consent,
      commerce,
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

    sendGTMEvent(buildAddToCartDataLayerEvent(event))
    return startAddToCartCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}
