'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useCookiebotConsent } from '@/lib/consent/useCookiebotConsent'
import {
  hasCookiebotStatisticsConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'
import { withoutTrackingQuery } from '@/lib/analytics/withoutTrackingQuery'

function beforeSend<T extends { url: string }>(
  event: T
): T | null {
  if (
    (window as Window & { __utekosConsentReloading?: boolean })
      .__utekosConsentReloading
  )
    return null
  const api = (window as Window & { Cookiebot?: CookiebotApi })
    .Cookiebot
  if (!hasCookiebotStatisticsConsent(api)) return null
  return { ...event, url: withoutTrackingQuery(event.url) }
}

export function VercelTelemetry() {
  const consent = useCookiebotConsent()
  if (!consent.statistics) return null
  return (
    <>
      <Analytics mode='production' beforeSend={beforeSend} />
      <SpeedInsights beforeSend={beforeSend} />
    </>
  )
}
