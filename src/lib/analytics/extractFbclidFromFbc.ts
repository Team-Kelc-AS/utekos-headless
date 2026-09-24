const META_COOKIE_PREFIX = 'fb'
const META_APPENDIX_PATTERN = /^[A-Za-z0-9_-]{8}$/

/**
 * Extracts the Meta click ID from an `_fbc` / `fbc` value.
 *
 * Supports both the classic 4-segment form and Parameter Builder
 * values that append an 8-character version token.
 */
export function extractFbclidFromFbc(
  fbc: string | undefined
): string | undefined {
  if (!fbc) return undefined

  const segments = fbc.split('.')
  if (segments.length < 4 || segments[0] !== META_COOKIE_PREFIX) {
    return undefined
  }

  const lastSegment = segments[segments.length - 1]
  const hasAppendix =
    segments.length >= 5 &&
    typeof lastSegment === 'string' &&
    META_APPENDIX_PATTERN.test(lastSegment)
  const clickIdSegments =
    hasAppendix ? segments.slice(3, -1) : segments.slice(3)
  const fbclid = clickIdSegments.join('.').trim()

  return fbclid.length > 0 ? fbclid : undefined
}

/**
 * Ensures checkout / purchase attribution keeps an explicit fbclid when
 * only the Meta `_fbc` cookie survived the browser journey.
 */
export function ensureFbclidFromFbc(input: {
  browser_id?: Record<string, string> | undefined
  click_id?: Record<string, string> | undefined
}): Record<string, string> | undefined {
  const existing = input.click_id
  if (existing?.fbclid) return existing

  const derived = extractFbclidFromFbc(input.browser_id?.fbc)
  if (!derived) return existing

  return {
    ...existing,
    fbclid: derived
  }
}

const SYNTHESIZED_FBC_CLICK_ID_PATTERN = /^[A-Za-z0-9_-]+$/

/**
 * Synthesizes a Meta `_fbc` value from a genuine fbclid when the browser
 * cookie never formed — typically the landing race where the first
 * commerce event fires before the pixel writes the cookie.
 *
 * This is serialization of an actually observed click, not a fabricated
 * identity: it must only be called with a real fbclid on a
 * marketing-consented dispatch. Returns undefined for anything else.
 */
export function ensureFbcFromFbclid(input: {
  fbc?: string | undefined
  fbclid?: string | undefined
  nowMs?: number | undefined
}): string | undefined {
  if (input.fbc) return input.fbc
  const fbclid = input.fbclid?.trim()
  if (!fbclid || !SYNTHESIZED_FBC_CLICK_ID_PATTERN.test(fbclid)) {
    return undefined
  }
  const nowMs = input.nowMs ?? Date.now()
  if (!Number.isFinite(nowMs) || nowMs <= 0) return undefined
  return `fb.1.${Math.floor(nowMs)}.${fbclid}`
}
