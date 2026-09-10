'use client'

import { readBrowserReporterContext } from './browserReporterContext'
import { ensureFbclidFromFbc } from './extractFbclidFromFbc'
import { createCheckoutAttributionSnapshot } from './checkoutAttributionSnapshot'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import { enrichCanonicalEventWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import { waitForCookiebotConsentReady } from '@/lib/consent/waitForCookiebotConsentReady'
import { emptyCheckoutConsent } from '@/lib/consent/emptyCheckoutConsent'
import type { CookiebotApi } from '@/lib/consent/cookiebotConsent'
import { applyCanonicalCollectionContext } from './applyCanonicalCollectionContext'

export async function captureBrowserCheckoutAttributionSnapshot() {
  await waitForCookiebotConsentReady()
  const context = readBrowserReporterContext()
  if (!context)
    return emptyCheckoutConsent(
      (window as Window & { Cookiebot?: CookiebotApi }).Cookiebot
    )
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

  const current = readBrowserReporterContext()
  if (!current)
    return emptyCheckoutConsent(
      (window as Window & { Cookiebot?: CookiebotApi }).Cookiebot
    )
  const consent = {
    ...current.consent,
    analytics:
      context.consent.analytics === 'granted' ?
        current.consent.analytics
      : ('denied' as const),
    marketing:
      context.consent.marketing === 'granted' ?
        current.consent.marketing
      : ('denied' as const)
  }
  return createCheckoutAttributionSnapshot(
    applyCanonicalCollectionContext(enriched, {
      consent,
      hasResponse: true,
      analyticsBrowserId: current.browserId
    })
  )
}
