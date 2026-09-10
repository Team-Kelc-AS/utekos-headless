import { hasBrowserCollectionConsent } from './hasBrowserCollectionConsent'
import {
  getConsentSnapshot,
  type CookiebotConsent
} from './pageViewClientContext'
import type { ConsentSnapshot } from './canonicalEventEnvelope'

export function isBrowserEventConsentCurrent(
  consent: ConsentSnapshot
) {
  if (!hasBrowserCollectionConsent()) return false
  const live = getConsentSnapshot(
    (
      window as Window & {
        Cookiebot?: { consent?: CookiebotConsent }
      }
    ).Cookiebot?.consent
  )
  return (
    live.analytics === consent.analytics &&
    live.marketing === consent.marketing
  )
}
