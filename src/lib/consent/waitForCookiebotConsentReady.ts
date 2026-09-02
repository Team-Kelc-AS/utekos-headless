'use client'

import {
  COOKIEBOT_CONSENT_EVENTS,
  type CookiebotApi
} from './cookiebotConsent'

const COOKIEBOT_READY_TIMEOUT_MS = 1000

export type CookiebotConsentReadyTarget = {
  __utekosCookiebotConsentReady?: boolean
  Cookiebot?: CookiebotApi & {
    consented?: boolean
    declined?: boolean
  }
  addEventListener: (
    eventName: string,
    listener: EventListener
  ) => void
  removeEventListener: (
    eventName: string,
    listener: EventListener
  ) => void
}

export async function waitForCookiebotConsentReady(
  target: CookiebotConsentReadyTarget = window,
  timeoutMs: number = COOKIEBOT_READY_TIMEOUT_MS
): Promise<void> {
  const hasResolvedDecision = () =>
    target.__utekosCookiebotConsentReady === true ||
    target.Cookiebot?.hasResponse === true ||
    target.Cookiebot?.consented === true ||
    target.Cookiebot?.declined === true

  if (hasResolvedDecision()) return

  await new Promise<void>(resolve => {
    const settle = () => {
      for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
        target.removeEventListener(eventName, handleConsentReady)
      }

      clearTimeout(timeout)
      resolve()
    }

    const handleConsentReady: EventListener = () => settle()

    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      target.addEventListener(eventName, handleConsentReady)
    }

    const timeout = setTimeout(settle, timeoutMs)

    if (hasResolvedDecision()) settle()
  })
}
