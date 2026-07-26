export const COOKIEBOT_CONSENT_EVENTS = [
  'CookiebotOnConsentReady',
  'CookiebotOnAccept',
  'CookiebotOnDecline'
] as const

export type CookiebotConsent = {
  marketing?: boolean
  preferences?: boolean
  statistics?: boolean
}

export type CookiebotApi = {
  consent?: CookiebotConsent
  hasResponse?: boolean
}

export function hasCookiebotStatisticsConsent(
  cookiebot: CookiebotApi | undefined
): boolean {
  return (
    cookiebot?.hasResponse === true &&
    cookiebot.consent?.statistics === true
  )
}

export function mapCookiebotConsentToShopify(
  cookiebot: CookiebotApi | undefined
): {
  analytics: boolean
  marketing: boolean
  preferences: boolean
} | null {
  if (cookiebot?.hasResponse !== true) return null

  return {
    analytics: cookiebot.consent?.statistics === true,
    marketing: cookiebot.consent?.marketing === true,
    preferences: cookiebot.consent?.preferences === true
  }
}
