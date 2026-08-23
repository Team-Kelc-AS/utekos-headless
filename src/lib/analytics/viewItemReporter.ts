'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import {
  extractBrowserIds,
  extractClickIds,
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import { browserFirstPartyExternalIdStore } from './firstPartyExternalId'
import {
  browserPageViewSession,
  type PageViewContext
} from './pageViewSession'
import { redactMarketingClickIdsFromUrl } from './preConsentClickIdStore'
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
  readClientContext: () => ViewItemClientContext
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
        const hasMarketingConsent =
          clientContext.consent.marketing === 'granted'
        const eventPageUrl =
          hasMarketingConsent ?
            pageView.pageUrl
          : redactMarketingClickIdsFromUrl(pageView.pageUrl)
        const eventReferrerUrl =
          pageView.referrerUrl ?
            hasMarketingConsent ?
              pageView.referrerUrl
            : redactMarketingClickIdsFromUrl(pageView.referrerUrl)
          : undefined

        const event = dependencies.createEvent({
          environment: clientContext.environment,
          eventId: dependencies.createEventId(),
          pageViewId: pageView.pageViewId,
          eventTime: dependencies.getEventTime(),
          pageUrl: eventPageUrl,
          ...(eventReferrerUrl ?
            { referrerUrl: eventReferrerUrl }
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

export function resolveTrackingEnvironment(
  pageUrl: string,
  nodeEnvironment: string | undefined
): TrackingEnvironment {
  if (nodeEnvironment === 'test') {
    return 'test'
  }

  const hostname = new URL(pageUrl).hostname.toLowerCase()

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  }

  if (nodeEnvironment !== 'production') {
    return 'development'
  }

  return (
      hostname === 'utekos.no' || hostname === 'www.utekos.no'
    ) ?
      'production'
    : 'preview'
}

const browserReporter = createViewItemReporter({
  pageViewSession: browserPageViewSession,
  readClientContext: readBrowserClientContext,
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
  return browserReporter(input)
}

type CookiebotWindow = Window & {
  Cookiebot?: { consent?: CookiebotConsent }
}

function readBrowserClientContext(): ViewItemClientContext {
  const currentPageUrl = window.location.href
  const currentDocumentReferrer = document.referrer

  const consent = getConsentSnapshot(
    (window as CookiebotWindow).Cookiebot?.consent
  )
  const hasMarketingConsent = consent.marketing === 'granted'

  const browserId = extractBrowserIds(document.cookie, consent)

  const observedClickId = extractClickIds(
    currentPageUrl,
    document.cookie,
    hasMarketingConsent
  )
  const clickId =
    hasMarketingConsent ? observedClickId : undefined
  const pageUrl =
    hasMarketingConsent ?
      currentPageUrl
    : redactMarketingClickIdsFromUrl(currentPageUrl)
  const documentReferrer =
    hasMarketingConsent ?
      currentDocumentReferrer
    : redactMarketingClickIdsFromUrl(currentDocumentReferrer)
  const externalId =
    browserFirstPartyExternalIdStore.getOrCreate(consent)

  const searchParams = new URL(currentPageUrl).searchParams

  const impressionId =
    searchParams.get('impression_id') ??
    searchParams.get('impressionId') ??
    undefined

  return {
    pageUrl,
    documentReferrer,
    pageTitle: document.title || 'Utekos',
    environment: resolveTrackingEnvironment(
      currentPageUrl,
      process.env.NODE_ENV
    ),
    consent,
    ...(browserId ? { browserId } : {}),
    ...(clickId ? { clickId } : {}),
    ...(externalId ? { externalId } : {}),
    ...(impressionId ? { impressionId } : {}),
    eventDeviceInfo: {
      language: navigator.language,
      pixelRatio: window.devicePixelRatio,
      platform: navigator.platform,
      screenHeight: window.screen.height,
      screenWidth: window.screen.width,
      userAgent: navigator.userAgent,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth
    }
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
