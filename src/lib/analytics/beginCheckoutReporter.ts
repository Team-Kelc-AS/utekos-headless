'use client'

import { enrichBrowserMetaAudience } from './browserMetaAudience'

import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import { readBrowserReporterContext } from './browserReporterContext'
import { isBrowserEventConsentCurrent } from './isBrowserEventConsentCurrent'
import { browserPageViewSession } from './pageViewSession'
import {
  buildBeginCheckoutDataLayerEvent,
  createCanonicalBeginCheckout,
  type CanonicalBeginCheckout
} from './beginCheckoutEvent'
import { collectCanonicalBeginCheckout } from './beginCheckoutCollectorTransport'
import { createCheckoutAttributionSnapshot } from './checkoutAttributionSnapshot'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import { enrichCanonicalEventWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import { persistCheckoutAttributionSnapshot } from './persistCheckoutAttributionSnapshot'
import { mapShopifyBeginCheckout } from './shopifyBeginCheckoutCommerce'
import type { CheckoutMethod } from './checkoutMethod'
import { readSkreddersyVarmenLayoutAssignment } from '@/lib/experiments/skreddersyVarmenLayoutExperiment'
import { waitForCookiebotConsentReady } from '@/lib/consent/waitForCookiebotConsentReady'
import { enrichCanonicalBrowserJourneyContext } from './internalJourneyContext'
import type { Cart } from 'types/cart'

const CHECKOUT_TASK_DEADLINE_MS = 1500

export type ReportCanonicalBeginCheckoutInput = {
  cart: Cart
  checkoutMethod?: CheckoutMethod
}

async function settleCheckoutTasks(tasks: Promise<unknown>[]) {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      Promise.allSettled(tasks),
      new Promise<undefined>(resolve => {
        timeout = setTimeout(
          () => resolve(undefined),
          CHECKOUT_TASK_DEADLINE_MS
        )
      })
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export async function reportCanonicalBeginCheckout(
  input: ReportCanonicalBeginCheckoutInput
): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  try {
    await waitForCookiebotConsentReady()
    const clientContext = readBrowserReporterContext()
    if (!clientContext) return
    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })

    const eventTime = new Date().toISOString()
    const commerce = await mapShopifyBeginCheckout(input.cart)
    if (!isBrowserEventConsentCurrent(clientContext.consent))
      return
    const experiment =
      clientContext.consent.analytics === 'granted' ?
        readSkreddersyVarmenLayoutAssignment()
      : undefined

    const initialEvent = createCanonicalBeginCheckout({
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
      ...(experiment ? { experiment } : {}),
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
    const metaEnrichedEvent =
      await enrichCanonicalEventWithMetaAttribution(
        enrichBrowserMetaAudience(initialEvent)
      )
    if (!isBrowserEventConsentCurrent(clientContext.consent))
      return
    const event = enrichCanonicalBrowserJourneyContext(
      await enrichCanonicalEventWithGoogleAnalyticsIds(
        metaEnrichedEvent
      )
    )
    if (!isBrowserEventConsentCurrent(clientContext.consent))
      return
    const snapshot = createCheckoutAttributionSnapshot(
      {
        ...event,
        ...(clientContext.campaignAttribution ?
          { campaign: clientContext.campaignAttribution }
        : {})
      },
      eventTime
    )

    sendGTMEvent(buildBeginCheckoutDataLayerEvent(event))

    try {
      await persistCheckoutAttributionSnapshot(
        input.cart.id,
        snapshot,
        event.event_id,
        event.custom_data.items
      )
    } catch (error) {
      reportClientCaughtError(
        error,
        'begin_checkout.checkout_attribution_persist'
      )
    }

    if (
      event.consent.analytics !== 'granted' &&
      event.consent.marketing !== 'granted'
    ) {
      return
    }

    const results = await settleCheckoutTasks([
      collectCanonicalBeginCheckout(
        event,
        input.checkoutMethod ?? 'shopify_checkout'
      )
    ])
    if (!results) {
      reportClientCaughtError(
        new Error('Checkout attribution handoff timed out'),
        'begin_checkout.checkout_handoff_timeout'
      )
      return
    }

    for (const result of results) {
      if (result.status === 'rejected') {
        reportClientCaughtError(
          result.reason,
          'begin_checkout.checkout_handoff'
        )
      }
    }
  } catch (error) {
    reportClientCaughtError(
      error,
      'begin_checkout.checkout_handoff'
    )
  }
}

export type { CanonicalBeginCheckout }
