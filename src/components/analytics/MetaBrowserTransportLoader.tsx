'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotMarketingConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'
import {
  discardRejectedMetaBrowserEvents,
  type MetaBrowserWindow
} from '@/lib/analytics/metaBrowserTransportRuntime'

type CookiebotWindow = MetaBrowserWindow & {
  Cookiebot?: CookiebotApi
}

type ConsentState = 'denied' | 'granted' | 'pending'

export function MetaBrowserTransportLoader() {
  const [consentState, setConsentState] =
    useState<ConsentState>('pending')

  useEffect(() => {
    const browserWindow = window as CookiebotWindow

    const synchronizeConsent = () => {
      const cookiebot = browserWindow.Cookiebot

      if (hasCookiebotMarketingConsent(cookiebot)) {
        setConsentState('granted')
        return
      }

      if (cookiebot?.hasResponse === true) {
        discardRejectedMetaBrowserEvents(browserWindow)
        setConsentState('denied')
      }
    }

    synchronizeConsent()
    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      window.addEventListener(eventName, synchronizeConsent)
    }

    return () => {
      for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
        window.removeEventListener(eventName, synchronizeConsent)
      }
    }
  }, [])

  if (consentState !== 'granted') return null

  return (
    <Script
      id='meta-pixel-canonical-browser'
      src='/analytics/meta-pixel-canonical-v1.js'
      strategy='afterInteractive'
    />
  )
}
