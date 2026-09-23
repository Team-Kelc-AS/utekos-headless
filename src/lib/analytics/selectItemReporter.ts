'use client'

// Wired via product list click helper (ProductCard / ProductGridCard).
import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import { mapShopifySelectItem } from './shopifySelectItemCommerce'
import {
  buildSelectItemDataLayerEvent,
  createCanonicalSelectItem,
  type CanonicalSelectItem,
  type CanonicalSelectItemCustomData
} from './selectItemEvent'
import { startSelectItemCollectorTransport } from './selectItemCollectorTransport'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type ReportCanonicalSelectItemInput = {
  destinationUrl?: string
  eventId?: string
  interactionId?: string
  itemListId: string
  pageViewId?: string
  product: ProductCommerceModel
  quantity?: number
  variant: ProductPurchaseVariant
}

export type ReportCanonicalSelectItemCustomDataInput = {
  customData: CanonicalSelectItemCustomData
  eventId?: string
  pageViewId?: string
}

export function reportCanonicalSelectItem(
  input: ReportCanonicalSelectItemInput
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  try {
    const customData = mapShopifySelectItem({
      product: input.product,
      variant: input.variant,
      itemListId: input.itemListId,
      interactionId:
        input.interactionId ?? globalThis.crypto.randomUUID(),
      ...(input.destinationUrl ?
        { destinationUrl: input.destinationUrl }
      : {}),
      ...(input.quantity !== undefined ?
        { quantity: input.quantity }
      : {})
    })

    return reportCanonicalSelectItemCustomData({
      customData,
      ...(input.eventId ? { eventId: input.eventId } : {}),
      ...(input.pageViewId ?
        { pageViewId: input.pageViewId }
      : {})
    })
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export function reportCanonicalSelectItemCustomData(
  input: ReportCanonicalSelectItemCustomDataInput
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

    const event = createCanonicalSelectItem({
      environment: clientContext.environment,
      eventId: input.eventId ?? globalThis.crypto.randomUUID(),
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

    sendGTMEvent(buildSelectItemDataLayerEvent(event))
    return startSelectItemCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export type { CanonicalSelectItem }
