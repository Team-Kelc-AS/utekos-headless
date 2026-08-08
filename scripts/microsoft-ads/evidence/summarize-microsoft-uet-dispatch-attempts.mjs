const DEFAULT_LOOKBACK_DAYS = 30
const ACCEPTED_STATUSES = new Set(['succeeded', 'accepted_unverified'])
const FAILURE_STATUSES = new Set(['failed', 'dead_lettered', 'retry_scheduled'])

export function summarizeMicrosoftUetDispatchAttempts(
  rows,
  { lookbackDays = DEFAULT_LOOKBACK_DAYS } = {}
) {
  if (!Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 365) {
    throw new TypeError(
      'Microsoft UET dispatch evidence lookbackDays must be an integer between 1 and 365.'
    )
  }

  const attempts = Array.isArray(rows) ? rows : []
  const byStatus = {}
  const byDispatchMode = {}
  const bySkipReason = {}
  const bySkipReasonLastSeenAt = {}
  const bySkipReasonAndEventName = {}
  const byEventName = {}
  let acceptedCount = 0
  let skippedCount = 0
  let failedCount = 0
  let firstSeenAt = null
  let lastSeenAt = null

  for (const row of attempts) {
    const status = normalizeKey(row?.status)
    const dispatchMode = normalizeKey(row?.dispatch_mode)
    const skipReason = normalizeKey(row?.skip_reason)
    const eventName = normalizeKey(row?.event_name)

    increment(byStatus, status)
    increment(byDispatchMode, dispatchMode)
    if (skipReason !== 'unknown') {
      increment(bySkipReason, skipReason)
      bySkipReasonAndEventName[skipReason] ??= {}
      increment(bySkipReasonAndEventName[skipReason], eventName)
    }
    increment(byEventName, eventName)

    const createdAt = normalizeTimestamp(row?.created_at)
    if (skipReason !== 'unknown' && createdAt) {
      const current = bySkipReasonLastSeenAt[skipReason]
      if (!current || createdAt > current) {
        bySkipReasonLastSeenAt[skipReason] = createdAt
      }
    }

    if (ACCEPTED_STATUSES.has(status)) acceptedCount += 1
    if (status === 'skipped_unqualified') skippedCount += 1
    if (FAILURE_STATUSES.has(status)) failedCount += 1

    if (createdAt) {
      if (!firstSeenAt || createdAt < firstSeenAt) firstSeenAt = createdAt
      if (!lastSeenAt || createdAt > lastSeenAt) lastSeenAt = createdAt
    }
  }

  return {
    ok: true,
    reason: null,
    lookbackDays,
    provider: 'microsoft_uet',
    rowCount: attempts.length,
    providerConfirmed: attempts.length > 0,
    firstSeenAt,
    lastSeenAt,
    acceptedCount,
    skippedCount,
    failedCount,
    byStatus,
    byDispatchMode,
    bySkipReason,
    bySkipReasonLastSeenAt,
    bySkipReasonAndEventName,
    byEventName
  }
}

function normalizeKey(value) {
  const normalized = String(value ?? '').trim()
  return normalized || 'unknown'
}

function increment(target, key) {
  target[key] = (target[key] ?? 0) + 1
}

function normalizeTimestamp(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
