const MINUTE_MS = 60_000
const BACKOFF_MULTIPLIER = 1.3
const MAX_DELAY_MS = 60 * MINUTE_MS
const POSITIVE_JITTER_RATIO = 0.05

export const GOOGLE_DATA_MANAGER_FIRST_STATUS_CHECK_DELAY_MS =
  30 * MINUTE_MS

export const GOOGLE_DATA_MANAGER_STATUS_POLLING_TIMEOUT_MS =
  24 * 60 * MINUTE_MS

export function computeGoogleDataManagerStatusDelayMs(
  completedChecks: number,
  random: () => number = Math.random
) {
  if (
    !Number.isInteger(completedChecks) ||
    completedChecks < 0
  ) {
    throw new Error(
      'Google Data Manager completed status checks must be a non-negative integer'
    )
  }

  const baseDelay = Math.min(
    MAX_DELAY_MS,
    GOOGLE_DATA_MANAGER_FIRST_STATUS_CHECK_DELAY_MS *
      BACKOFF_MULTIPLIER ** completedChecks
  )
  const sample = random()
  const normalizedSample =
    Number.isFinite(sample) ?
      Math.min(1, Math.max(0, sample))
    : 0
  const jitteredDelay = Math.floor(
    baseDelay * (1 + POSITIVE_JITTER_RATIO * normalizedSample)
  )

  return Math.min(MAX_DELAY_MS, jitteredDelay)
}
