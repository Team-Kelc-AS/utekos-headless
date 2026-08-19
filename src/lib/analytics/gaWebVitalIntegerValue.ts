import type { WebVitalMetricName } from './webVitalMetricName'

/**
 * GA4 event `value` must be an integer. This is a derived mapping, not the
 * raw Web Vital: CLS is multiplied by 1000 then rounded; other metrics are
 * rounded millisecond values. Keep the original float in `custom_data.value`.
 */
export function gaWebVitalIntegerValue(
  name: WebVitalMetricName,
  value: number
): number {
  return Math.round(name === 'CLS' ? value * 1000 : value)
}
