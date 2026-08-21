'use client'

import { readBrowserReporterContext } from './browserReporterContext'
import { ensureFbclidFromFbc } from './extractFbclidFromFbc'
import { createCheckoutAttributionSnapshot } from './checkoutAttributionSnapshot'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import { enrichCanonicalEventWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'

export async function captureBrowserCheckoutAttributionSnapshot() {
  const context = readBrowserReporterContext()
  const clickId = ensureFbclidFromFbc({
    ...(context.browserId ?
      { browser_id: context.browserId }
    : {}),
    ...(context.clickId ? { click_id: context.clickId } : {})
  })
  const initialContext = {
    consent: context.consent,
    page_url: context.pageUrl,
    ...(context.documentReferrer ?
      { referrer_url: context.documentReferrer }
    : {}),
    ...(context.browserId ?
      { browser_id: context.browserId }
    : {}),
    ...(clickId ? { click_id: clickId } : {}),
    ...(context.campaignAttribution ?
      { campaign: context.campaignAttribution }
    : {}),
    ...(context.externalId ?
      { external_id: context.externalId }
    : {})
  }
  const metaEnriched =
    await enrichCanonicalEventWithMetaAttribution(initialContext)
  const derivedClickId = ensureFbclidFromFbc(metaEnriched)
  const withDerivedClickId = {
    ...metaEnriched,
    ...(derivedClickId ? { click_id: derivedClickId } : {})
  }
  const enriched =
    await enrichCanonicalEventWithGoogleAnalyticsIds(
      withDerivedClickId
    )

  return createCheckoutAttributionSnapshot(enriched)
}
