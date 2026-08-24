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
import { redactMarketingClickIdsFromUrl } from './preConsentClickIdStore'
import { resolveTrackingEnvironment } from './viewItemReporter'
import type {
  ConsentSnapshot,
  TrackingEnvironment
} from './pageViewEvent'

export type BrowserReporterContext = {
  browserId?: Record<string, string>
  campaignAttribution?: CampaignAttribution
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

export function readBrowserReporterContext(): BrowserReporterContext {
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
  const campaignAttribution =
    hasMarketingConsent ?
      resolveCampaignAttribution(currentPageUrl)
    : undefined
  const externalId =
    browserFirstPartyExternalIdStore.getOrCreate(consent)

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
