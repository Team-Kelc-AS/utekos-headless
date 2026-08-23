import type { ConsentSnapshot } from './pageViewEvent'
import { resolveClickIds } from './clickIdSessionStore'
import {
  capturePreConsentClickIdsFromUrl,
  readPreConsentClickIds,
  setPreConsentClickIdDecision
} from './preConsentClickIdStore'

export type CookiebotConsent = {
  marketing?: boolean
  preferences?: boolean
  statistics?: boolean
}

function granted(value: boolean | undefined) {
  return value === true ? 'granted' : 'denied'
}

function parseCookies(
  cookieHeader: string
): Map<string, string> {
  const cookies = new Map<string, string>()

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 1) continue

    const name = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (name && value)
      cookies.set(name, decodeURIComponent(value))
  }

  return cookies
}

export function getConsentSnapshot(
  consent: CookiebotConsent | undefined
): ConsentSnapshot {
  return {
    analytics: granted(consent?.statistics),
    marketing: granted(consent?.marketing),
    preferences: granted(consent?.preferences),
    source: 'cookiebot',
    version: '1'
  }
}

export function extractClickIds(
  pageUrl: string,
  cookieHeader: string = '',
  marketingConsentGranted: boolean = false
) {
  if (marketingConsentGranted) {
    setPreConsentClickIdDecision('granted')
  }

  capturePreConsentClickIdsFromUrl(pageUrl)

  const preConsentClickIds = readPreConsentClickIds()
  const epik =
    marketingConsentGranted ?
      parseCookies(cookieHeader).get('_epik')
    : undefined

  return resolveClickIds(
    pageUrl,
    undefined,
    undefined,
    undefined,
    {
      ...preConsentClickIds,
      ...(epik ? { epik } : {})
    },
    marketingConsentGranted
  )
}

export function extractBrowserIds(
  cookieHeader: string,
  consent: ConsentSnapshot
) {
  const cookies = parseCookies(cookieHeader)
  const identifiers: Record<string, string> = {}

  if (consent.marketing === 'granted') {
    const fbp = cookies.get('_fbp')
    const fbc = cookies.get('_fbc')
    const uetSession = cookies.get('_uetsid')
    const uetVisitor = cookies.get('_uetvid')
    const snapchatCookie = cookies.get('_scid')
    if (fbp) identifiers.fbp = fbp
    if (fbc) identifiers.fbc = fbc
    if (uetSession) identifiers.uet_session = uetSession
    if (uetVisitor) identifiers.uet_visitor = uetVisitor
    if (snapchatCookie) identifiers.sc_cookie1 = snapchatCookie
  }

  if (consent.analytics === 'granted') {
    const gaClient = cookies.get('_ga')
    if (gaClient) identifiers.ga_client = gaClient
  }

  return Object.keys(identifiers).length > 0 ?
      identifiers
    : undefined
}
