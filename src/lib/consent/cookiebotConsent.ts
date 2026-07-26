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

export type ShopifyTrackingConsent = {
  analytics: boolean
  marketing: boolean
  preferences: boolean
  headlessStorefront: true
  checkoutRootDomain: 'kasse.utekos.no'
  storefrontRootDomain: 'utekos.no'
  storefrontAccessToken: string
}

export function hasCookiebotStatisticsConsent(
  cookiebot: CookiebotApi | undefined
): boolean {
  return (
    cookiebot?.hasResponse === true &&
    cookiebot.consent?.statistics === true
  )
}

export function hasCookiebotMarketingConsent(
  cookiebot: CookiebotApi | undefined
): boolean {
  return (
    cookiebot?.hasResponse === true &&
    cookiebot.consent?.marketing === true
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

export function buildShopifyTrackingConsent({
  consent,
  storefrontAccessToken
}: {
  consent: NonNullable<ReturnType<typeof mapCookiebotConsentToShopify>>
  storefrontAccessToken: string
}): ShopifyTrackingConsent {
  return {
    ...consent,
    headlessStorefront: true,
    checkoutRootDomain: 'kasse.utekos.no',
    storefrontRootDomain: 'utekos.no',
    storefrontAccessToken
  }
}
