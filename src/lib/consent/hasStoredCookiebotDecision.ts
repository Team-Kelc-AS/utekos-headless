const MAX_COOKIE_CONSENT_LENGTH = 4096
const STAMP_PATTERN = /(?:^|[,\s{])stamp\s*:/iu
const EXPLICIT_METHOD_PATTERN =
  /(?:^|[,\s{])method\s*:\s*['"]?explicit['"]?(?=\s*[,}])/iu

export function hasStoredCookiebotDecision(
  cookieValue: string | undefined
): boolean {
  if (
    !cookieValue ||
    cookieValue.length > MAX_COOKIE_CONSENT_LENGTH
  ) {
    return false
  }

  let decoded: string
  try {
    decoded = decodeURIComponent(cookieValue)
  } catch {
    return false
  }

  return (
    STAMP_PATTERN.test(decoded) ||
    EXPLICIT_METHOD_PATTERN.test(decoded)
  )
}

export function readCookiebotConsentCookie(
  cookieSource: string
): string | undefined {
  const match = cookieSource.match(
    /(?:^|;\s*)CookieConsent=([^;]*)/u
  )
  return match?.[1]
}
