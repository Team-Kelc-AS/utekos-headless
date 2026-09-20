import type { CookieSettings } from 'capi-param-builder-nodejs'
import type { ConsentSnapshot } from '../canonicalEventEnvelope'
import type { CanonicalClickIds } from '../canonicalSignalContract'
import { extractFbclidFromFbc } from '../extractFbclidFromFbc'
import { processMetaParameterContext } from './processMetaParameterContext'

export type EnsureCanonicalMetaBrowserIdsInput = {
  browserId?: Record<string, string> | undefined
  clickId?: CanonicalClickIds | undefined
  clientIpAddress?: string | undefined
  consent: ConsentSnapshot
  cookieHeader?: string | undefined
  pageUrl: string
  requestUrl?: string | undefined
}

export type EnsureCanonicalMetaBrowserIdsResult = {
  browserId?: Record<string, string> | undefined
  clickId?: CanonicalClickIds | undefined
  cookiesToSet: CookieSettings[]
}

function parseCookieMap(
  cookieHeader: string | undefined
): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 1) continue

    const name = part.slice(0, separator).trim()
    const rawValue = part.slice(separator + 1).trim()
    if (!name || !rawValue) continue

    try {
      cookies[name] = decodeURIComponent(rawValue)
    } catch {
      cookies[name] = rawValue
    }
  }

  return cookies
}

function readFbclidFromUrl(urlValue: string | undefined) {
  if (!urlValue) return undefined

  try {
    const value = new URL(urlValue).searchParams.get('fbclid')
    return value?.trim() ? value : undefined
  } catch {
    return undefined
  }
}

/**
 * CanonicalEvent-first Meta browser-id enhancement for server accept.
 * Reads fbclid from page_url query, then request URL query, then click_id,
 * then existing _fbc. Mints first-party _fbp/_fbc via ParamBuilder when
 * marketing is granted and cookies are missing or a new URL click is observed.
 */
export function ensureCanonicalMetaBrowserIds(
  input: EnsureCanonicalMetaBrowserIdsInput
): EnsureCanonicalMetaBrowserIdsResult {
  const marketingGranted = input.consent.marketing === 'granted'
  const existingBrowserId = input.browserId
  const existingClickId = input.clickId

  if (!marketingGranted) {
    return { cookiesToSet: [] }
  }

  const fbclidFromRequest = readFbclidFromUrl(input.requestUrl)
  const fbclidFromPage = readFbclidFromUrl(input.pageUrl)
  const fbclidFromClick =
    existingClickId?.fbclid?.trim() || undefined
  const fbclidFromFbc = extractFbclidFromFbc(
    existingBrowserId?.fbc
  )
  // Document URL query is Meta's primary source; API request query is fallback.
  const fbclid =
    fbclidFromPage ??
    fbclidFromRequest ??
    fbclidFromClick ??
    fbclidFromFbc

  const clickId =
    fbclid || existingClickId ?
      {
        ...(existingClickId ?? {}),
        ...(fbclid ? { fbclid } : {})
      }
    : undefined

  const cookies = parseCookieMap(input.cookieHeader)
  if (existingBrowserId?.fbp && !cookies._fbp) {
    cookies._fbp = existingBrowserId.fbp
  }
  if (existingBrowserId?.fbc && !cookies._fbc) {
    cookies._fbc = existingBrowserId.fbc
  }

  let fbp = existingBrowserId?.fbp ?? cookies._fbp
  let fbc = existingBrowserId?.fbc ?? cookies._fbc
  let cookiesToSet: CookieSettings[] = []

  const needsFbp = !fbp
  const needsFbc = Boolean(fbclid) && !fbc
  const observedFbclid = fbclidFromPage ?? fbclidFromRequest
  const hasNewUrlClick =
    Boolean(observedFbclid) &&
    observedFbclid !== extractFbclidFromFbc(fbc)

  if (needsFbp || needsFbc || hasNewUrlClick) {
    const derived = processMetaParameterContext({
      ...(input.clientIpAddress ?
        { clientIpAddress: input.clientIpAddress }
      : {}),
      cookies,
      payload: {
        consent: input.consent,
        page_url: input.pageUrl,
        ...(fbclid ? { fbclid } : {})
      }
    })

    cookiesToSet = derived.cookiesToSet
    if (derived.identifiers.fbp) fbp = derived.identifiers.fbp
    if (derived.identifiers.fbc) fbc = derived.identifiers.fbc
  }

  const browserId = {
    ...(existingBrowserId ?? {}),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {})
  }

  return {
    ...(Object.keys(browserId).length > 0 ? { browserId } : {}),
    ...(clickId && Object.keys(clickId).length > 0 ?
      { clickId }
    : {}),
    cookiesToSet
  }
}
