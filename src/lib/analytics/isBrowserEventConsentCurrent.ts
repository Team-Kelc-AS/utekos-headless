import { hasBrowserCollectionConsent } from './hasBrowserCollectionConsent'
import {
  getConsentSnapshot
} from './pageViewClientContext'
import type { ConsentSnapshot } from './canonicalEventEnvelope'

export function isBrowserEventConsentCurrent(
  consent: ConsentSnapshot
) {
  if (!hasBrowserCollectionConsent()) return false
  const live = getConsentSnapshot()
  return (
    live.analytics === consent.analytics &&
    live.marketing === consent.marketing
  )
}
