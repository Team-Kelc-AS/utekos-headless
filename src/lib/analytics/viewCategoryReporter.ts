'use client'

import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import {
  buildViewCategoryDataLayerEvent,
  createCanonicalViewCategory,
  type CanonicalViewCategory,
  type CanonicalViewCategoryCustomData
} from './viewCategoryEvent'
import { collectViewCategoryUntilAccepted } from './viewCategoryCollectorTransport'

export type ReportCanonicalViewCategoryInput = {
  customData: CanonicalViewCategoryCustomData
  pageViewId?: string
}

export function reportCanonicalViewCategory(
  input: ReportCanonicalViewCategoryInput
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let cancelled = false

  void reportCanonicalViewCategoryEvent(input, () => cancelled).catch(
    error => {
      if (cancelled) return
      reportClientCaughtError(
        error,
        'view_category.first_party_collector'
      )
    }
  )

  return () => {
    cancelled = true
  }
}

async function reportCanonicalViewCategoryEvent(
  input: ReportCanonicalViewCategoryInput,
  isCancelled: () => boolean
) {
  const clientContext = readBrowserReporterContext()
  if (!clientContext) return
  const pageView = browserPageViewSession.ensure({
    pageUrl: clientContext.pageUrl,
    ...(clientContext.documentReferrer ?
      { documentReferrer: clientContext.documentReferrer }
    : {})
  })

  const event = createCanonicalViewCategory({
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

  const accepted = await collectViewCategoryUntilAccepted(event)
  if (isCancelled() || !accepted) return

  sendGTMEvent(buildViewCategoryDataLayerEvent(event))
}

export type { CanonicalViewCategory }
