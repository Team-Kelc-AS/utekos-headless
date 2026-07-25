export const COOKIEBOT_CONSENT_EVENTS = [
  'CookiebotOnConsentReady',
  'CookiebotOnAccept',
  'CookiebotOnDecline'
] as const

export type CookiebotMarketingApi = {
  consent?: { marketing?: boolean }
  renew?: () => void
}

export function hasCookiebotMarketingConsent(
  cookiebot?: CookiebotMarketingApi
) {
  return cookiebot?.consent?.marketing === true
}

export function subscribeToCookiebotConsent(
  target: Pick<
    Window,
    'addEventListener' | 'removeEventListener'
  >,
  listener: () => void
) {
  for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
    target.addEventListener(eventName, listener)
  }

  return () => {
    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      target.removeEventListener(eventName, listener)
    }
  }
}

export function renewCookiebotConsent(
  cookiebot?: CookiebotMarketingApi
) {
  cookiebot?.renew?.()
}
