import {
  hasCookiebotCollectionConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'

export function hasBrowserCollectionConsent() {
  return (
    typeof window !== 'undefined' &&
    !(window as Window & { __utekosConsentReloading?: boolean })
      .__utekosConsentReloading &&
    hasCookiebotCollectionConsent(
      (window as Window & { Cookiebot?: CookiebotApi }).Cookiebot
    )
  )
}
