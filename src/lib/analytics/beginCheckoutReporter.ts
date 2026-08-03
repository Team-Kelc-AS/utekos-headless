'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { captureException } from '@sentry/nextjs'
import { readBrowserReporterContext } from './browserReporterContext'
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
    const clientContext = readBrowserReporterContext()
    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })

    const eventTime = new Date().toISOString()
    const commerce = mapShopifyBeginCheckout(input.cart)

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
      await enrichCanonicalEventWithMetaAttribution(initialEvent)
    const event =
      await enrichCanonicalEventWithGoogleAnalyticsIds(
        metaEnrichedEvent
      )
    const snapshot = createCheckoutAttributionSnapshot(
      event,
      eventTime
    )

    sendGTMEvent(buildBeginCheckoutDataLayerEvent(event))
    const tasks: Promise<unknown>[] = [
      persistCheckoutAttributionSnapshot(input.cart.id, snapshot)
    ]

    if (
      event.consent.analytics === 'granted' ||
      event.consent.marketing === 'granted'
    ) {
      tasks.push(
        collectCanonicalBeginCheckout(
          event,
          input.checkoutMethod ?? 'shopify_checkout'
        )
      )
    }

    const results = await settleCheckoutTasks(tasks)
    if (!results) {
      captureException(
        new Error('Checkout attribution handoff timed out'),
        {
          tags: {
            analytics_event: 'begin_checkout',
            analytics_stage: 'checkout_handoff_timeout'
          }
        }
      )
      return
    }

    for (const result of results) {
      if (result.status === 'rejected') {
        captureException(result.reason, {
          tags: {
            analytics_event: 'begin_checkout',
            analytics_stage: 'checkout_handoff'
          }
        })
      }
    }
  } catch (error) {
    captureException(error, {
      tags: {
        analytics_event: 'begin_checkout',
        analytics_stage: 'checkout_handoff'
      }
    })
  }
}

export type { CanonicalBeginCheckout }
