import type { CanonicalWebVital } from '../webVitalEvent'

export type WebVitalInsertRow = {
  attribution?: Record<string, unknown>
  delta: number
  entries: unknown[]
  href: string
  metric_id: string
  name: string
  navigation_type?: string
  pathname: string
  rating?: 'good' | 'needs-improvement' | 'poor'
  referrer?: string
  reported_at: string
  value: number
}

export function mapCanonicalWebVitalToRow(
  event: CanonicalWebVital
): WebVitalInsertRow {
  return {
    ...(event.custom_data.attribution ?
      { attribution: event.custom_data.attribution }
    : {}),
    delta: event.custom_data.delta,
    entries: event.custom_data.entries,
    href: event.page_url,
    metric_id: event.custom_data.metric_id,
    name: event.custom_data.name,
    ...(event.custom_data.navigation_type ?
      { navigation_type: event.custom_data.navigation_type }
    : {}),
    pathname: event.custom_data.pathname,
    ...(event.custom_data.rating ?
      { rating: event.custom_data.rating }
    : {}),
    ...(event.referrer_url ? { referrer: event.referrer_url } : {}),
    reported_at: event.event_time,
    value: event.custom_data.value
  }
}
