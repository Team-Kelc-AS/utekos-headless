'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { withoutTrackingQuery } from '@/lib/analytics/withoutTrackingQuery'

const VERCEL_TELEMETRY_PATH = '/telemetry/v1'

function beforeSend<T extends { url: string }>(event: T): T {
  return { ...event, url: withoutTrackingQuery(event.url) }
}

export function VercelTelemetry() {
  return (
    <>
      <Analytics
        mode='production'
        beforeSend={beforeSend}
        scriptSrc={`${VERCEL_TELEMETRY_PATH}/web.js`}
        viewEndpoint={`${VERCEL_TELEMETRY_PATH}/view`}
        eventEndpoint={`${VERCEL_TELEMETRY_PATH}/event`}
      />
      <SpeedInsights
        beforeSend={beforeSend}
        scriptSrc={`${VERCEL_TELEMETRY_PATH}/speed.js`}
        endpoint={`${VERCEL_TELEMETRY_PATH}/vitals`}
      />
    </>
  )
}
