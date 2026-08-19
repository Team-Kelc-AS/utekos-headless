'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { readBrowserReporterContext } from './browserReporterContext'
import { logWebVital } from './logWebVital'
import { browserPageViewSession } from './pageViewSession'
import { serializeWebVitalEntries } from './serializeWebVitalEntries'
import { createWebVitalCollectorTransport } from './webVitalCollectorTransport'
import {
  buildWebVitalCustomData,
  buildWebVitalDataLayerEvent,
  createCanonicalWebVital,
  webVitalRatingSchema,
  type CanonicalWebVital,
  type CanonicalWebVitalCustomData
} from './webVitalEvent'
import type { WebVitalMetricName } from './webVitalMetricName'

export type ReportableWebVitalMetric = {
  attribution?: Record<string, unknown>
  delta: number
  entries?: unknown[]
  id: string
  name: WebVitalMetricName
  navigationType?: string
  rating?: string
  value: number
}

const startWebVitalCollectorTransport = createWebVitalCollectorTransport(
  async event => {
    sendGTMEvent(buildWebVitalDataLayerEvent(event))
    return event
  }
)

function readAttribution(
  metric: ReportableWebVitalMetric
): Record<string, unknown> | undefined {
  const attribution = metric.attribution
  if (!attribution || Array.isArray(attribution)) {
    return undefined
  }

  return attribution
}

function readRating(
  rating: string | undefined
): CanonicalWebVitalCustomData['rating'] | undefined {
  if (!rating) return undefined
  const parsed = webVitalRatingSchema.safeParse(rating)
  return parsed.success ? parsed.data : undefined
}

export function reportCanonicalWebVital(
  metric: ReportableWebVitalMetric
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const pathname = window.location.pathname || '/'
  logWebVital({
    name: metric.name,
    pathname,
    ...(metric.rating ? { rating: metric.rating } : {}),
    value: metric.value
  })

  try {
    const clientContext = readBrowserReporterContext()
    const pageView = browserPageViewSession.ensure({
      pageUrl: clientContext.pageUrl,
      ...(clientContext.documentReferrer ?
        { documentReferrer: clientContext.documentReferrer }
      : {})
    })
    const attribution = readAttribution(metric)
    const rating = readRating(metric.rating)

    const event = createCanonicalWebVital({
      environment: clientContext.environment,
      eventId: globalThis.crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      pageUrl: clientContext.pageUrl,
      pageTitle: clientContext.pageTitle,
      pageViewId: pageView.pageViewId,
      ...(pageView.referrerUrl ?
        { referrerUrl: pageView.referrerUrl }
      : {}),
      consent: clientContext.consent,
      customData: buildWebVitalCustomData({
        ...(attribution ? { attribution } : {}),
        delta: metric.delta,
        entries: serializeWebVitalEntries(metric.entries),
        metricId: metric.id,
        name: metric.name,
        ...(metric.navigationType ?
          { navigationType: metric.navigationType }
        : {}),
        pathname,
        ...(rating ? { rating } : {}),
        value: metric.value
      }),
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

    return startWebVitalCollectorTransport(event)
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
    return () => {}
  }
}

export type { CanonicalWebVital }
