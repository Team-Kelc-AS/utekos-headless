'use client'

import { readBrowserReporterContext } from './browserReporterContext'
import { ensureFbclidFromFbc } from './extractFbclidFromFbc'
import { createCheckoutAttributionSnapshot } from './checkoutAttributionSnapshot'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import { enrichCanonicalEventWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import { applyCanonicalCollectionContext } from './applyCanonicalCollectionContext'

export async function captureBrowserCheckoutAttributionSnapshot() {
  const context = readBrowserReporterContext()
  if (!context)
    return {
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'granted',
        source: 'cookiebot',
        version: '1'
      }
    }
  const clickId = ensureFbclidFromFbc({
    ...(context.browserId ?
      { browser_id: context.browserId }
    : {}),
    ...(context.clickId ? { click_id: context.clickId } : {})
  })
  const initialContext = {
    consent: context.consent,
    ...(context.metaAudience ?
      { meta_audience: context.metaAudience }
    : {}),
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

  const current = readBrowserReporterContext()
  if (!current) return { consent: { analytics: 'granted', marketing: 'granted' } }
  const consent = {
    ...current.consent,
    analytics:
      context.consent.analytics === 'granted' ?
        current.consent.analytics
      : ('granted' as const),
    marketing:
      context.consent.marketing === 'granted' ?
        current.consent.marketing
      : ('granted' as const)
  }
  return createCheckoutAttributionSnapshot(
    applyCanonicalCollectionContext(enriched, {
      consent,
      hasResponse: true,
      analyticsBrowserId: current.browserId
    })
  )
}
