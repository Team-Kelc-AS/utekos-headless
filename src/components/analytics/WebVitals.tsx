'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { reportCanonicalWebVital } from '@/lib/analytics/webVitalReporter'
import { webVitalMetricNameSchema } from '@/lib/analytics/webVitalMetricName'

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0]
type NextWebVitalMetric = Parameters<ReportWebVitalsCallback>[0]

function readMetricAttribution(
  metric: NextWebVitalMetric
): Record<string, unknown> | undefined {
  if (!('attribution' in metric)) {
    return undefined
  }

  const attribution = metric.attribution
  if (
    attribution === null ||
    typeof attribution !== 'object' ||
    Array.isArray(attribution)
  ) {
    return undefined
  }

  return attribution as Record<string, unknown>
}

const handleWebVitals: ReportWebVitalsCallback = metric => {
  const parsedName = webVitalMetricNameSchema.safeParse(metric.name)
  if (!parsedName.success) {
    console.warn('[web-vital]', {
      name: metric.name,
      pathname: typeof window === 'undefined' ? '' : window.location.pathname,
      value: metric.value
    })
    return
  }

  const metricName = parsedName.data

  switch (metricName) {
    case 'CLS':
    case 'FCP':
    case 'FID':
    case 'INP':
    case 'LCP':
    case 'TTFB':
    case 'Next.js-hydration':
    case 'Next.js-route-change-to-render':
    case 'Next.js-render': {
      const attribution = readMetricAttribution(metric)
      reportCanonicalWebVital({
        ...(attribution ? { attribution } : {}),
        delta: metric.delta,
        ...(metric.entries ? { entries: [...metric.entries] } : {}),
        id: metric.id,
        name: metricName,
        ...(metric.navigationType ?
          { navigationType: metric.navigationType }
        : {}),
        ...(metric.rating ? { rating: metric.rating } : {}),
        value: metric.value
      })
      return
    }
    default: {
      const unexpected: never = metricName
      void unexpected
    }
  }
}

export function WebVitals() {
  useReportWebVitals(handleWebVitals)
  return null
}
