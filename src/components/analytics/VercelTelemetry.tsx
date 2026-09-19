'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { withoutTrackingQuery } from '@/lib/analytics/withoutTrackingQuery'

function beforeSend<T extends { url: string }>(event: T): T {
  return { ...event, url: withoutTrackingQuery(event.url) }
}

export function VercelTelemetry() {
  return (
    <>
      <Analytics mode='production' beforeSend={beforeSend} />
      <SpeedInsights beforeSend={beforeSend} />
    </>
  )
}
