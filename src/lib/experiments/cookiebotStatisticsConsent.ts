const MAX_COOKIE_CONSENT_LENGTH = 4096
const STATISTICS_CONSENT_PATTERN =
  /(?:^|[,\s{])statistics\s*:\s*(true|false)(?=\s*[,}])/iu

export function hasCookiebotStatisticsConsent(
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

  return STATISTICS_CONSENT_PATTERN.exec(decoded)?.[1] === 'true'
}
