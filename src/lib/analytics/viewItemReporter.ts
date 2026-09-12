'use client'

import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import { hasBrowserCollectionConsent } from './hasBrowserCollectionConsent'
import { COOKIEBOT_CONSENT_EVENTS } from '@/lib/consent/cookiebotConsent'
import { readBrowserReporterContext } from './browserReporterContext'
import {
  browserPageViewSession,
  type PageViewContext
} from './pageViewSession'
import {
  buildViewItemDataLayerEvent,
  createCanonicalViewItem,
  type CanonicalViewItem,
  type CanonicalViewItemCommerce
} from './viewItemEvent'
import { mapShopifyViewItem } from './shopifyViewItemCommerce'
import { startViewItemCollectorTransport } from './viewItemCollectorTransport'
import type {
  ConsentSnapshot,
  TrackingEnvironment
} from './pageViewEvent'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type ViewItemDeviceInfo = {
  language?: string
  pixelRatio?: number
  platform?: string
  screenHeight?: number
  screenWidth?: number
  userAgent?: string
  viewportHeight?: number
  viewportWidth?: number
}

type ViewItemClientContext = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  documentReferrer: string
  environment: TrackingEnvironment
  eventDeviceInfo?: ViewItemDeviceInfo
  externalId?: string
  impressionId?: string
  pageTitle: string
  pageUrl: string
}

type PageViewSessionPort = {
  ensure(input: {
    pageUrl: string
    documentReferrer?: string
  }): PageViewContext
  hasEmitted(pageViewId: string): boolean
  subscribe(
    listener: (context: PageViewContext) => void
  ): () => void
}

type ViewItemReporterDependencies = {
  pageViewSession: PageViewSessionPort
  readClientContext: () => ViewItemClientContext | null
  mapCommerce(input: {
    product: ProductCommerceModel
    variant: ProductPurchaseVariant
  }): CanonicalViewItemCommerce
  createEvent: typeof createCanonicalViewItem
  createEventId: () => string
  getEventTime: () => string
  emitEvent: (event: CanonicalViewItem) => (() => void) | void
  reportError: (error: unknown) => void
}

export type ReportCanonicalViewItemInput = {
  product: ProductCommerceModel
  variant: ProductPurchaseVariant
  onEmitted?: () => void
}

export function createViewItemReporter(
  dependencies: ViewItemReporterDependencies
) {
  return function reportCanonicalViewItem(
    input: ReportCanonicalViewItemInput
  ): () => void {
    const initialContext = dependencies.readClientContext()
    if (!initialContext) return () => {}

    const expectedPageUrl = normalizePageUrl(
      initialContext.pageUrl
    )
    const expectedPageResource =
      normalizePageResource(expectedPageUrl)

    const provisionalPageView =
      dependencies.pageViewSession.ensure({
        pageUrl: expectedPageUrl,
        ...(initialContext.documentReferrer ?
          { documentReferrer: initialContext.documentReferrer }
        : {})
      })

    let cancelled = false
    let completed = false
    let unsubscribe: (() => void) | undefined
    let stopCollector: (() => void) | undefined

    const stop = () => {
      cancelled = true
      unsubscribe?.()
      unsubscribe = undefined

      if (!completed) {
        stopCollector?.()
        stopCollector = undefined
      }
    }

    const emitForPageView = (pageView: PageViewContext) => {
      if (
        cancelled ||
        completed ||
        normalizePageResource(pageView.pageUrl) !==
          expectedPageResource ||
        !dependencies.pageViewSession.hasEmitted(
          pageView.pageViewId
        )
      ) {
        return
      }

      const clientContext = dependencies.readClientContext()
      if (!clientContext) {
        stop()
        return
      }

      if (
        normalizePageResource(clientContext.pageUrl) !==
        expectedPageResource
      ) {
        return
      }

      try {
        const commerce = dependencies.mapCommerce({
          product: input.product,
          variant: input.variant
        })

        const event = dependencies.createEvent({
          environment: clientContext.environment,
          eventId: dependencies.createEventId(),
          pageViewId: pageView.pageViewId,
          eventTime: dependencies.getEventTime(),
          pageUrl: pageView.pageUrl,
          ...(pageView.referrerUrl ?
            { referrerUrl: pageView.referrerUrl }
          : {}),
          pageTitle: clientContext.pageTitle,
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
          ...(clientContext.impressionId ?
            { impressionId: clientContext.impressionId }
          : {}),
          ...(clientContext.eventDeviceInfo ?
            { eventDeviceInfo: clientContext.eventDeviceInfo }
          : {})
        })

        stopCollector =
          dependencies.emitEvent(event) || undefined
        completed = true
        input.onEmitted?.()
      } catch (error) {
        completed = true
        dependencies.reportError(error)
      } finally {
        unsubscribe?.()
        unsubscribe = undefined
      }
    }

    if (
      dependencies.pageViewSession.hasEmitted(
        provisionalPageView.pageViewId
      )
    ) {
      emitForPageView(provisionalPageView)
    } else {
      unsubscribe =
        dependencies.pageViewSession.subscribe(emitForPageView)
    }

    return stop
  }
}

export { resolveTrackingEnvironment } from './resolveTrackingEnvironment'

const browserReporter = createViewItemReporter({
  pageViewSession: browserPageViewSession,
  readClientContext: readBrowserReporterContext,
  mapCommerce: mapShopifyViewItem,
  createEvent: createCanonicalViewItem,
  createEventId: () => globalThis.crypto.randomUUID(),
  getEventTime: () => new Date().toISOString(),
  emitEvent: event => {
    sendGTMEvent(buildViewItemDataLayerEvent(event))
    return startViewItemCollectorTransport(event)
  },
  reportError: error => {
    queueMicrotask(() => {
      throw error
    })
  }
})

export function reportCanonicalViewItem(
  input: ReportCanonicalViewItemInput
): () => void {
  if (typeof window === 'undefined') return () => {}
  let cleanup: (() => void) | undefined
  const evaluate = () => {
    if (cleanup || !hasBrowserCollectionConsent()) return
    cleanup = browserReporter(input)
  }
  for (const name of COOKIEBOT_CONSENT_EVENTS)
    window.addEventListener(name, evaluate)
  evaluate()
  return () => {
    for (const name of COOKIEBOT_CONSENT_EVENTS)
      window.removeEventListener(name, evaluate)
    cleanup?.()
  }
}

function normalizePageUrl(pageUrl: string): string {
  const url = new URL(pageUrl)

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('pageUrl must be an absolute HTTP(S) URL')
  }

  return url.href
}

function normalizePageResource(pageUrl: string): string {
  const url = new URL(normalizePageUrl(pageUrl))

  return `${url.origin}${url.pathname}`
}
