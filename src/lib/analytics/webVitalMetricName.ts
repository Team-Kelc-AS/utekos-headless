import { z } from 'zod'

export const webVitalMetricNameSchema = z.enum([
  'CLS',
  'INP',
  'LCP',
  'FCP',
  'TTFB',
  'FID',
  'Next.js-hydration',
  'Next.js-route-change-to-render',
  'Next.js-render'
])

export type WebVitalMetricName = z.infer<typeof webVitalMetricNameSchema>
