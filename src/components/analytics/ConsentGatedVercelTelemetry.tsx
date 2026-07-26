'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useEffect, useState } from 'react'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotStatisticsConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'

type VercelTelemetryWindow = Window & {
  Cookiebot?: CookiebotApi
  va?: (...args: unknown[]) => void
  si?: (...args: unknown[]) => void
}

function currentStatisticsConsent(): boolean {
  return hasCookiebotStatisticsConsent(
    (window as VercelTelemetryWindow).Cookiebot
  )
}

function stopVercelTelemetry(): void {
  const browserWindow = window as VercelTelemetryWindow
  const rejectEvent = () => null

  browserWindow.va?.('beforeSend', rejectEvent)
  browserWindow.si?.('beforeSend', rejectEvent)
}

function allowOnlyWithCurrentStatisticsConsent<T>(
  event: T
): T | null {
  return currentStatisticsConsent() ? event : null
}

export function ConsentGatedVercelTelemetry() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const syncConsent = () => {
      const nextEnabled = currentStatisticsConsent()
      setEnabled(nextEnabled)

      if (!nextEnabled) stopVercelTelemetry()
    }

    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      window.addEventListener(eventName, syncConsent)
    }

    syncConsent()

    return () => {
      for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
        window.removeEventListener(eventName, syncConsent)
      }
      stopVercelTelemetry()
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <Analytics
        beforeSend={allowOnlyWithCurrentStatisticsConsent}
      />
      <SpeedInsights
        beforeSend={allowOnlyWithCurrentStatisticsConsent}
      />
    </>
  )
}
