'use client'

import { useSyncExternalStore } from 'react'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotStatisticsConsent,
  hasCookiebotMarketingConsent,
  type CookiebotApi
} from './cookiebotConsent'

function subscribe(listener: () => void) {
  for (const event of COOKIEBOT_CONSENT_EVENTS)
    window.addEventListener(event, listener)
  return () => {
    for (const event of COOKIEBOT_CONSENT_EVENTS)
      window.removeEventListener(event, listener)
  }
}

function snapshot() {
  const api = (window as Window & { Cookiebot?: CookiebotApi })
    .Cookiebot
  return (
    Number(hasCookiebotStatisticsConsent(api)) |
    (Number(hasCookiebotMarketingConsent(api)) << 1)
  )
}

export function useCookiebotConsent() {
  const state = useSyncExternalStore(
    subscribe,
    snapshot,
    () => 0
  )
  return {
    statistics: Boolean(state & 1),
    marketing: Boolean(state & 2)
  }
}
