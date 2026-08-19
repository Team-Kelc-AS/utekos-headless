#!/usr/bin/env node

import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import postgres from 'postgres'

dotenv.config({ path: '.env.local', quiet: true })

const ACTIVE_QUEUE_STATUSES = new Set(['pending', 'processing', 'retry_scheduled'])
const FAILED_STATUSES = new Set(['failed', 'dead_lettered'])
const DEFAULT_THRESHOLDS = {
  maxActiveQueueRows: 25,
  maxFailedRows: 0,
  maxUnresolvedDeadLetters: 0,
  maxSkippedRate: 0.5,
  minSkippedRateRows: 10
}

function getCliFlag(name, argv = process.argv.slice(2)) {
  return argv.includes(name)
}

function getEnvNumber(env, key, fallback) {
  const rawValue = env[key]
  if (rawValue === undefined || rawValue === '') {
    return fallback
  }

  const parsed = Number(rawValue)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function getThresholds(env = process.env) {
  return {
    maxActiveQueueRows: getEnvNumber(
      env,
      'OPS_PROVIDER_DISPATCH_MAX_ACTIVE_QUEUE_ROWS',
      DEFAULT_THRESHOLDS.maxActiveQueueRows
    ),
    maxFailedRows: getEnvNumber(
      env,
      'OPS_PROVIDER_DISPATCH_MAX_FAILED_ROWS',
      DEFAULT_THRESHOLDS.maxFailedRows
    ),
    maxUnresolvedDeadLetters: getEnvNumber(
      env,
      'OPS_PROVIDER_DISPATCH_MAX_UNRESOLVED_DEAD_LETTERS',
      DEFAULT_THRESHOLDS.maxUnresolvedDeadLetters
    ),
    maxSkippedRate: getEnvNumber(
      env,
      'OPS_PROVIDER_DISPATCH_MAX_SKIPPED_RATE',
      DEFAULT_THRESHOLDS.maxSkippedRate
    ),
    minSkippedRateRows: getEnvNumber(
      env,
      'OPS_PROVIDER_DISPATCH_MIN_SKIPPED_RATE_ROWS',
      DEFAULT_THRESHOLDS.minSkippedRateRows
    )
  }
}

export function getWarehouseUrl(env = process.env) {
  return (
    env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING
    || env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING_MAYBE
    || env.SUPABASE_VERCEL_POSTGRES_URL
    || null
  )
}

function toNonNegativeNumber(value) {
  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value)
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value)
  }

  return 0
}

function normalizeNullableText(value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback
  }

  return value.trim()
}

export function redactOperationalText(value) {
  return normalizeNullableText(value, 'n/a')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/((?:access_)?token=)[^&\s]+/gi, '$1[redacted]')
    .replace(/((?:secret|password|api[_-]?key)=)[^&\s]+/gi, '$1[redacted]')
    .slice(0, 240)
}

function createProviderSummary(provider) {
  return {
    provider,
    totalRows: 0,
    activeQueueRows: 0,
    failedRows: 0,
    skippedRows: 0,
    succeededRows: 0,
    skippedRate: 0,
    statuses: {}
  }
}

function summarizeProviderRows(providerRows) {
  const summariesByProvider = new Map()

  for (const row of providerRows) {
    const provider = normalizeNullableText(row.provider, 'unknown')
    const status = normalizeNullableText(row.status, 'unknown')
    const rowCount = toNonNegativeNumber(row.row_count)
    const summary = summariesByProvider.get(provider) ?? createProviderSummary(provider)

    summary.totalRows += rowCount
    summary.statuses[status] = (summary.statuses[status] ?? 0) + rowCount

    if (ACTIVE_QUEUE_STATUSES.has(status)) {
      summary.activeQueueRows += rowCount
    }

    if (FAILED_STATUSES.has(status)) {
      summary.failedRows += rowCount
    }

    if (status === 'skipped_unqualified') {
      summary.skippedRows += rowCount
    }

    if (status === 'succeeded') {
      summary.succeededRows += rowCount
    }

    summariesByProvider.set(provider, summary)
  }

  return [...summariesByProvider.values()]
    .map(summary => ({
      ...summary,
      skippedRate: summary.totalRows > 0 ? summary.skippedRows / summary.totalRows : 0
    }))
    .sort((left, right) => left.provider.localeCompare(right.provider))
}

function normalizeProviderRows(providerRows) {
  return providerRows.map(row => ({
    provider: normalizeNullableText(row.provider, 'unknown'),
    status: normalizeNullableText(row.status, 'unknown'),
    dispatchMode: normalizeNullableText(row.dispatch_mode, 'unknown'),
    skipReason: redactOperationalText(row.skip_reason),
    rowCount: toNonNegativeNumber(row.row_count),
    lastUpdatedAt: row.last_updated_at ?? null,
    lastProcessedAt: row.last_processed_at ?? null
  }))
}

function normalizeDeadLetterRows(deadLetterRows) {
  return deadLetterRows.map(row => ({
    source: normalizeNullableText(row.source, 'unknown'),
    reason: redactOperationalText(row.reason),
    unresolvedCount: toNonNegativeNumber(row.unresolved_count),
    totalCount: toNonNegativeNumber(row.total_count),
    latestCreatedAt: row.latest_created_at ?? null,
    latestResolvedAt: row.latest_resolved_at ?? null
  }))
}

function buildAlerts(providerSummaries, deadLetterSummaries, thresholds) {
  const alerts = []
  const activeQueueRows = providerSummaries.reduce(
    (total, summary) => total + summary.activeQueueRows,
    0
  )
  const failedRows = providerSummaries.reduce((total, summary) => total + summary.failedRows, 0)
  const unresolvedDeadLetters = deadLetterSummaries.reduce(
    (total, summary) => total + summary.unresolvedCount,
    0
  )

  if (providerSummaries.length === 0) {
    alerts.push({
      severity: 'warning',
      code: 'provider_dispatch_health_empty',
      message: 'No rows were returned from ops.provider_dispatch_health.'
    })
  }

  if (activeQueueRows > thresholds.maxActiveQueueRows) {
    alerts.push({
      severity: 'warning',
      code: 'provider_dispatch_active_queue_threshold',
      message: `Active provider queue rows ${activeQueueRows} exceed threshold ${thresholds.maxActiveQueueRows}.`
    })
  }

  if (failedRows > thresholds.maxFailedRows) {
    alerts.push({
      severity: 'critical',
      code: 'provider_dispatch_failed_threshold',
      message: `Failed/dead-lettered provider rows ${failedRows} exceed threshold ${thresholds.maxFailedRows}.`
    })
  }

  if (unresolvedDeadLetters > thresholds.maxUnresolvedDeadLetters) {
    alerts.push({
      severity: 'critical',
      code: 'dead_letter_unresolved_threshold',
      message: `Unresolved dead letters ${unresolvedDeadLetters} exceed threshold ${thresholds.maxUnresolvedDeadLetters}.`
    })
  }

  for (const summary of providerSummaries) {
    if (
      summary.totalRows >= thresholds.minSkippedRateRows
      && summary.skippedRate > thresholds.maxSkippedRate
    ) {
      alerts.push({
        severity: 'warning',
        code: 'provider_dispatch_skipped_rate_threshold',
        message: `${summary.provider} skipped_unqualified rate ${(summary.skippedRate * 100).toFixed(1)}% exceeds threshold ${(thresholds.maxSkippedRate * 100).toFixed(1)}%.`
      })
    }
  }

  return alerts
}

export function buildReport(providerRows, deadLetterRows, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS
  const providerHealth = normalizeProviderRows(providerRows)
  const deadLetters = normalizeDeadLetterRows(deadLetterRows)
  const providerSummaries = summarizeProviderRows(providerRows)
  const alerts = buildAlerts(providerSummaries, deadLetters, thresholds)

  return {
    generatedAt,
    thresholds,
    totals: {
      providers: providerSummaries.length,
      providerRows: providerSummaries.reduce((total, summary) => total + summary.totalRows, 0),
      activeQueueRows: providerSummaries.reduce(
        (total, summary) => total + summary.activeQueueRows,
        0
      ),
      failedRows: providerSummaries.reduce((total, summary) => total + summary.failedRows, 0),
      unresolvedDeadLetters: deadLetters.reduce(
        (total, summary) => total + summary.unresolvedCount,
        0
      ),
      alertCount: alerts.length
    },
    providerSummaries,
    providerHealth,
    deadLetters,
    alerts
  }
}

export function formatReport(report) {
  const lines = [
    'Utekos provider dispatch feedback report',
    `Generated at: ${report.generatedAt}`,
    '',
    'Totals',
    `- providers: ${report.totals.providers}`,
    `- provider rows: ${report.totals.providerRows}`,
    `- active queue rows: ${report.totals.activeQueueRows}`,
    `- failed/dead-lettered rows: ${report.totals.failedRows}`,
    `- unresolved dead letters: ${report.totals.unresolvedDeadLetters}`,
    `- alerts: ${report.totals.alertCount}`,
    '',
    'Provider summaries'
  ]

  if (report.providerSummaries.length === 0) {
    lines.push('- none')
  } else {
    for (const summary of report.providerSummaries) {
      lines.push(
        `- ${summary.provider}: total=${summary.totalRows}, active_queue=${summary.activeQueueRows}, failed=${summary.failedRows}, skipped=${summary.skippedRows}, skipped_rate=${(summary.skippedRate * 100).toFixed(1)}%`
      )
    }
  }

  lines.push('', 'Dead letters')

  if (report.deadLetters.length === 0) {
    lines.push('- none')
  } else {
    for (const row of report.deadLetters) {
      lines.push(
        `- ${row.source} | ${row.reason}: unresolved=${row.unresolvedCount}, total=${row.totalCount}, latest=${row.latestCreatedAt ?? 'n/a'}`
      )
    }
  }

  lines.push('', 'Alerts')

  if (report.alerts.length === 0) {
    lines.push('- none')
  } else {
    for (const alert of report.alerts) {
      lines.push(`- ${alert.severity.toUpperCase()} ${alert.code}: ${alert.message}`)
    }
  }

  return `${lines.join('\n')}\n`
}

async function queryOperationalViews(warehouseUrl) {
  const sql = postgres(warehouseUrl, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false
  })

  try {
    const providerRows = await sql`
      select
        provider,
        status,
        dispatch_mode,
        skip_reason,
        row_count,
        last_updated_at,
        last_processed_at
      from ops.provider_dispatch_health
      order by provider, dispatch_mode, status, skip_reason nulls first
    `
    const deadLetterRows = await sql`
      select
        source,
        reason,
        unresolved_count,
        total_count,
        latest_created_at,
        latest_resolved_at
      from ops.dead_letter_summary
      order by unresolved_count desc, total_count desc, source, reason
    `

    return {
      providerRows,
      deadLetterRows
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const warehouseUrl = getWarehouseUrl()
  const outputJson = getCliFlag('--json')
  const failOnAlerts =
    getCliFlag('--fail-on-alerts') || process.env.OPS_PROVIDER_DISPATCH_FAIL_ON_ALERTS === '1'

  if (!warehouseUrl) {
    console.error(
      'No Supabase tracking warehouse URL configured. Set SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING or SUPABASE_VERCEL_POSTGRES_URL.'
    )
    process.exitCode = 1
    return
  }

  const { providerRows, deadLetterRows } = await queryOperationalViews(warehouseUrl)
  const report = buildReport(providerRows, deadLetterRows, {
    thresholds: getThresholds()
  })

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    process.stdout.write(formatReport(report))
  }

  if (failOnAlerts && report.alerts.length > 0) {
    process.exitCode = 2
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
