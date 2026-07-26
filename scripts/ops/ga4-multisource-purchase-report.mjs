#!/usr/bin/env node

import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import postgres from 'postgres'

import { getWarehouseUrl } from './provider-dispatch-feedback-report.mjs'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({
  path: '.env.mcp.local',
  override: false,
  quiet: true
})

const DEFAULT_LOOKBACK_DAYS = 14
const MAX_LOOKBACK_DAYS = 90

function cliFlag(name, argv = process.argv.slice(2)) {
  return argv.includes(name)
}

function cliValue(name, argv = process.argv.slice(2)) {
  const prefix = `${name}=`
  const value = argv.find(argument =>
    argument.startsWith(prefix)
  )

  return value?.slice(prefix.length)
}

function lookbackDays(argv = process.argv.slice(2)) {
  const rawValue = cliValue('--days', argv)
  if (!rawValue) return DEFAULT_LOOKBACK_DAYS

  const value = Number(rawValue)
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_LOOKBACK_DAYS
  ) {
    throw new Error(
      `--days must be an integer between 1 and ${MAX_LOOKBACK_DAYS}`
    )
  }

  return value
}

function count(value) {
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
  }

  return 0
}

function text(value, fallback = 'unknown') {
  return typeof value === 'string' && value.trim() !== '' ?
      value.trim()
    : fallback
}

function alert(code, message) {
  return { code, message, severity: 'critical' }
}

function buildAlerts(report) {
  const alerts = []
  const diagnostics = report.diagnostics

  if (diagnostics.providerConfirmedWithWarnings > 0) {
    alerts.push(
      alert(
        'provider_success_with_warnings',
        `${diagnostics.providerConfirmedWithWarnings} Google request(s) succeeded with warnings and require review.`
      )
    )
  }
  if (diagnostics.deadLettered > 0) {
    alerts.push(
      alert(
        'provider_dead_lettered',
        `${diagnostics.deadLettered} Google purchase request(s) are dead-lettered.`
      )
    )
  }
  if (diagnostics.recordCountMismatch > 0) {
    alerts.push(
      alert(
        'provider_record_count_mismatch',
        `${diagnostics.recordCountMismatch} provider-confirmed request(s) do not have record_count=1.`
      )
    )
  }
  if (diagnostics.warningRecords > 0) {
    alerts.push(
      alert(
        'provider_warning_records',
        `Google diagnostics reported ${diagnostics.warningRecords} warning record(s).`
      )
    )
  }
  if (diagnostics.errorRecords > 0) {
    alerts.push(
      alert(
        'provider_error_records',
        `Google diagnostics reported ${diagnostics.errorRecords} error record(s).`
      )
    )
  }
  if (diagnostics.statusTimeout > 0) {
    alerts.push(
      alert(
        'provider_status_timeout',
        `${diagnostics.statusTimeout} request(s) exceeded the 24-hour status window.`
      )
    )
  }
  if (diagnostics.statusOlderThan24Hours > 0) {
    alerts.push(
      alert(
        'provider_status_stale',
        `${diagnostics.statusOlderThan24Hours} request(s) are still unresolved after 24 hours.`
      )
    )
  }

  return alerts
}

export function buildReport(
  summaryRow = {},
  providerRows = [],
  options = {}
) {
  const report = {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    lookbackDays: options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS,
    totals: {
      canonicalPurchases: count(
        summaryRow.canonical_purchase_count
      ),
      googleAttempts: count(summaryRow.google_attempt_count),
      duplicateTransactions: count(
        summaryRow.duplicate_transaction_count
      ),
      providerConfirmedSuccess: count(
        summaryRow.provider_confirmed_success_count
      )
    },
    identifiers: {
      clientId: count(summaryRow.client_id_count),
      gclid: count(summaryRow.gclid_count),
      userId: count(summaryRow.user_id_count),
      eligible: count(summaryRow.eligible_identifier_count)
    },
    freshness: {
      within48Hours: count(summaryRow.within_48h_count),
      lateWithinWindow: count(
        summaryRow.late_within_window_count
      ),
      outside72Hours: count(summaryRow.outside_72h_count)
    },
    diagnostics: {
      providerConfirmedWithWarnings: count(
        summaryRow.provider_confirmed_warning_count
      ),
      deadLettered: count(summaryRow.dead_lettered_count),
      recordCountMismatch: count(
        summaryRow.record_count_mismatch_count
      ),
      warningRecords: count(summaryRow.warning_record_count),
      errorRecords: count(summaryRow.error_record_count),
      statusTimeout: count(summaryRow.status_timeout_count),
      statusOlderThan24Hours: count(
        summaryRow.status_older_than_24h_count
      )
    },
    validation: {
      validateOnly: count(summaryRow.validate_only_count),
      legacyWithoutMetadata: count(
        summaryRow.legacy_validation_metadata_count
      )
    },
    providerStatuses: providerRows.map(row => ({
      status: text(row.status),
      responseSemantics: text(row.response_semantics, 'none'),
      rows: count(row.row_count)
    }))
  }

  return { ...report, alerts: buildAlerts(report) }
}

export function formatReport(report) {
  const lines = [
    'Utekos GA4 multi-source purchase report',
    `Generated at: ${report.generatedAt}`,
    `Lookback: ${report.lookbackDays} day(s)`,
    '',
    'Totals',
    `- canonical purchases: ${report.totals.canonicalPurchases}`,
    `- Google attempts: ${report.totals.googleAttempts}`,
    `- provider-confirmed success: ${report.totals.providerConfirmedSuccess}`,
    `- duplicate transaction IDs: ${report.totals.duplicateTransactions}`,
    '',
    'Identifier coverage',
    `- clientId: ${report.identifiers.clientId}`,
    `- GCLID: ${report.identifiers.gclid}`,
    `- User-ID: ${report.identifiers.userId}`,
    `- at least one eligible identifier: ${report.identifiers.eligible}`,
    '',
    'Freshness',
    `- within 48 hours: ${report.freshness.within48Hours}`,
    `- late within window: ${report.freshness.lateWithinWindow}`,
    `- outside 72 hours: ${report.freshness.outside72Hours}`,
    '',
    'Provider statuses'
  ]

  if (report.providerStatuses.length === 0) {
    lines.push('- none')
  } else {
    for (const row of report.providerStatuses) {
      lines.push(
        `- ${row.status} | ${row.responseSemantics}=${row.rows}`
      )
    }
  }

  lines.push(
    '',
    'Diagnostics',
    `- success with warnings: ${report.diagnostics.providerConfirmedWithWarnings}`,
    `- dead-lettered: ${report.diagnostics.deadLettered}`,
    `- record-count mismatches: ${report.diagnostics.recordCountMismatch}`,
    `- warning records: ${report.diagnostics.warningRecords}`,
    `- error records: ${report.diagnostics.errorRecords}`,
    `- provider status timeout: ${report.diagnostics.statusTimeout}`,
    `- unresolved status older than 24 hours: ${report.diagnostics.statusOlderThan24Hours}`,
    '',
    'Validation metadata',
    `- validate_only=true: ${report.validation.validateOnly}`,
    `- legacy rows without validate_only metadata: ${report.validation.legacyWithoutMetadata}`,
    '',
    'Alerts'
  )

  if (report.alerts.length === 0) {
    lines.push('- none')
  } else {
    for (const currentAlert of report.alerts) {
      lines.push(
        `- ${currentAlert.severity.toUpperCase()} ${currentAlert.code}: ${currentAlert.message}`
      )
    }
  }

  return `${lines.join('\n')}\n`
}

async function queryReport(warehouseUrl, days) {
  const sql = postgres(warehouseUrl, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false
  })

  try {
    const summaryRows = await sql`
      with recent_purchases as (
        select event_id, payload, occurred_at
        from marketing.event_ledger
        where event_name = 'purchase'
          and occurred_at >= now() - make_interval(days => ${days})
      ),
      recent_attempts as (
        select attempt.*
        from ops.provider_dispatch_attempts attempt
        where attempt.provider = 'google'
          and attempt.event_name = 'purchase'
          and attempt.created_at >= now() - make_interval(days => ${days})
      ),
      operational_attempts as (
        select *
        from recent_attempts
        where validation_result ->> 'validate_only' is distinct from 'true'
      ),
      duplicate_transactions as (
        select payload #>> '{custom_data,transaction_id}'
        from recent_purchases
        group by payload #>> '{custom_data,transaction_id}'
        having count(*) > 1
      ),
      warning_records as (
        select coalesce(sum((warning.value #>> '{}')::bigint), 0) as value
        from operational_attempts attempt
        cross join lateral jsonb_path_query(
          attempt.response,
          '$.requestStatus.requestStatusPerDestination[*].warningInfo.warningCounts[*].recordCount'
        ) warning(value)
      ),
      error_records as (
        select coalesce(sum((error.value #>> '{}')::bigint), 0) as value
        from operational_attempts attempt
        cross join lateral jsonb_path_query(
          attempt.response,
          '$.requestStatus.requestStatusPerDestination[*].errorInfo.errorCounts[*].recordCount'
        ) error(value)
      )
      select
        (select count(*) from recent_purchases) as canonical_purchase_count,
        (select count(*) from operational_attempts) as google_attempt_count,
        count(*) filter (
          where nullif(payload #>> '{browser_id,ga_client_id}', '') is not null
        ) as client_id_count,
        count(*) filter (
          where nullif(payload #>> '{click_id,gclid}', '') is not null
        ) as gclid_count,
        count(*) filter (
          where nullif(payload ->> 'external_id', '') is not null
        ) as user_id_count,
        count(*) filter (
          where nullif(payload #>> '{browser_id,ga_client_id}', '') is not null
            or nullif(payload #>> '{click_id,gclid}', '') is not null
            or nullif(payload ->> 'external_id', '') is not null
        ) as eligible_identifier_count,
        count(*) filter (
          where created_at - (payload ->> 'event_time')::timestamptz
            <= interval '48 hours'
        ) as within_48h_count,
        count(*) filter (
          where created_at - (payload ->> 'event_time')::timestamptz
            > interval '48 hours'
            and created_at - (payload ->> 'event_time')::timestamptz
              <= interval '72 hours'
        ) as late_within_window_count,
        count(*) filter (
          where created_at - (payload ->> 'event_time')::timestamptz
            > interval '72 hours'
        ) as outside_72h_count,
        (select count(*) from duplicate_transactions)
          as duplicate_transaction_count,
        count(*) filter (
          where response_semantics = 'provider_confirmed_success'
        ) as provider_confirmed_success_count,
        count(*) filter (
          where response_semantics =
            'provider_confirmed_success_with_warnings'
        ) as provider_confirmed_warning_count,
        count(*) filter (where status = 'dead_lettered')
          as dead_lettered_count,
        count(*) filter (
          where response_semantics = 'provider_confirmed_success'
            and coalesce(
              (
                jsonb_path_query_first(
                  response,
                  '$.requestStatus.requestStatusPerDestination[0].eventsIngestionStatus.recordCount'
                ) #>> '{}'
              )::integer,
              -1
            ) <> 1
        ) as record_count_mismatch_count,
        (select value from warning_records) as warning_record_count,
        (select value from error_records) as error_record_count,
        count(*) filter (
          where response_semantics = 'provider_status_timeout'
        ) as status_timeout_count,
        count(*) filter (
          where status = 'accepted_unverified'
            and coalesce(processed_at, created_at)
              <= now() - interval '24 hours'
            and response_semantics not in (
              'provider_confirmed_success_with_warnings',
              'provider_status_timeout'
            )
        ) as status_older_than_24h_count,
        (select count(*) from recent_attempts
          where validation_result ->> 'validate_only' = 'true')
          as validate_only_count,
        (select count(*) from recent_attempts
          where not (validation_result ? 'validate_only')
            and status <> 'skipped_unqualified')
          as legacy_validation_metadata_count
      from operational_attempts
    `
    const providerRows = await sql`
      select
        status,
        response_semantics,
        count(*) as row_count
      from ops.provider_dispatch_attempts
      where provider = 'google'
        and event_name = 'purchase'
        and created_at >= now() - make_interval(days => ${days})
        and validation_result ->> 'validate_only' is distinct from 'true'
      group by status, response_semantics
      order by status, response_semantics nulls first
    `

    return { providerRows, summaryRow: summaryRows[0] ?? {} }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const warehouseUrl = getWarehouseUrl()
  const days = lookbackDays()

  if (!warehouseUrl) {
    throw new Error(
      'No Supabase tracking warehouse URL configured. Set SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING or SUPABASE_VERCEL_POSTGRES_URL.'
    )
  }

  const { providerRows, summaryRow } = await queryReport(
    warehouseUrl,
    days
  )
  const report = buildReport(summaryRow, providerRows, {
    lookbackDays: days
  })

  if (cliFlag('--json')) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    process.stdout.write(formatReport(report))
  }

  if (cliFlag('--fail-on-alerts') && report.alerts.length > 0) {
    process.exitCode = 2
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(
      error instanceof Error ? error.message : String(error)
    )
    process.exitCode = 1
  })
}
