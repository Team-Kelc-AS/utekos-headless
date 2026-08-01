'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function VercelTelemetry() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
