'use client'

import {
  extractBrowserIds,
  extractClickIds,
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import { browserFirstPartyExternalIdStore } from './firstPartyExternalId'
import {
  resolveCampaignAttribution,
  type CampaignAttribution
} from './campaignAttributionSessionStore'
import { resolveTrackingEnvironment } from './resolveTrackingEnvironment'
import { hasBrowserCollectionConsent } from './hasBrowserCollectionConsent'
import { readBrowserMetaAudience } from './browserMetaAudience'
import type { MetaAudience } from './metaAudience'
import { withoutTrackingQuery } from './withoutTrackingQuery'
import type {
  ConsentSnapshot,
  TrackingEnvironment
} from './pageViewEvent'

export type BrowserReporterContext = {
  browserId?: Record<string, string>
  campaignAttribution?: CampaignAttribution
  metaAudience?: MetaAudience
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  documentReferrer: string
  environment: TrackingEnvironment
  eventDeviceInfo: {
    language: string
    pixelRatio: number
    platform: string
    screenHeight: number
    screenWidth: number
    userAgent: string
    viewportHeight: number
    viewportWidth: number
  }
  externalId?: string
  pageTitle: string
  pageUrl: string
}

type CookiebotWindow = Window & {
  Cookiebot?: { consent?: CookiebotConsent }
}

export function readBrowserReporterContext(
  pageUrl?: string
): BrowserReporterContext | null {
  if (!hasBrowserCollectionConsent()) return null
  pageUrl ??= window.location.href
  const consent = getConsentSnapshot(
    (window as CookiebotWindow).Cookiebot?.consent
  )
  const metaAudience = readBrowserMetaAudience(consent)
  const browserId = extractBrowserIds(document.cookie, consent)
  const clickId =
    consent.marketing === 'granted' ?
      extractClickIds(pageUrl, document.cookie, true)
    : undefined
  const campaignAttribution =
    consent.marketing === 'granted' ?
      resolveCampaignAttribution(pageUrl)
    : undefined
  const externalId =
    browserFirstPartyExternalIdStore.getOrCreate(consent)

  return {
    pageUrl:
      consent.marketing === 'granted' ?
        pageUrl
      : withoutTrackingQuery(pageUrl),
    documentReferrer:
      consent.marketing === 'granted' ?
        document.referrer
      : withoutTrackingQuery(document.referrer),
    pageTitle: document.title || 'Utekos',
    environment: resolveTrackingEnvironment(
      pageUrl,
      process.env.NODE_ENV
    ),
    consent,
    ...(metaAudience ? { metaAudience } : {}),
    ...(browserId ? { browserId } : {}),
    ...(campaignAttribution ? { campaignAttribution } : {}),
    ...(clickId ? { clickId } : {}),
    ...(externalId ? { externalId } : {}),
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
