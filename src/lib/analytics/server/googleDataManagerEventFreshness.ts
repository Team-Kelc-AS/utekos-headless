const HOUR_MS = 60 * 60 * 1_000

export type GoogleDataManagerEventFreshness =
  | 'within_48h'
  | 'late_within_window'
  | 'outside_72h'

export function classifyGoogleDataManagerEventFreshness(
  eventTime: string,
  now = Date.now()
): GoogleDataManagerEventFreshness {
  const occurredAt = Date.parse(eventTime)

  if (!Number.isFinite(occurredAt) || !Number.isFinite(now)) {
    throw new Error(
      'Google Data Manager freshness requires a valid event_time'
    )
  }

  const ageMs = Math.max(0, now - occurredAt)

  if (ageMs <= 48 * HOUR_MS) return 'within_48h'
  if (ageMs <= 72 * HOUR_MS) return 'late_within_window'

  return 'outside_72h'
}
