'use client'

// Reporter used by the canonical 50%-for-one-second list visibility detector.
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import { readBrowserReporterContext } from './browserReporterContext'
import { browserPageViewSession } from './pageViewSession'
import {
  buildViewItemListDataLayerEvent,
  createCanonicalViewItemList,
  type CanonicalViewItemList,
  type CanonicalViewItemListCustomData
} from './viewItemListEvent'
import { collectViewItemListUntilAccepted } from './viewItemListCollectorTransport'

export type ReportCanonicalViewItemListInput = {
  customData: CanonicalViewItemListCustomData
  pageViewId?: string
}

export function reportCanonicalViewItemList(
  input: ReportCanonicalViewItemListInput
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let cancelled = false

  void reportCanonicalViewItemListEvent(input, () => cancelled).catch(
    error => {
      if (cancelled) return
      reportClientCaughtError(
        error,
        'view_item_list.first_party_collector'
      )
    }
  )

  return () => {
    cancelled = true
  }
}

async function reportCanonicalViewItemListEvent(
  input: ReportCanonicalViewItemListInput,
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

  const event = createCanonicalViewItemList({
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

  const accepted = await collectViewItemListUntilAccepted(event)
  if (isCancelled() || !accepted) return

  sendGTMEvent(buildViewItemListDataLayerEvent(event))
}

export type { CanonicalViewItemList }
