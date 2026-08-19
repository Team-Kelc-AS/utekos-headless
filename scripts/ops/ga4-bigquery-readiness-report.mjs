#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local', quiet: true })

const execFileAsync = promisify(execFile)

const DEFAULT_PROJECT_ID = 'project-c683eb2c-20ae-4ec2-ac3'
const DEFAULT_DATASET_ID = 'analytics_489598217'
const DEFAULT_PROPERTY_ID = '489598217'
const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/
const DATASET_ID_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,1023}$/

function getCliFlag(name, argv = process.argv.slice(2)) {
  return argv.includes(name)
}

function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() !== '' ?
      value.trim()
    : fallback
}

function requireMatchingText(value, pattern, label) {
  const normalized = normalizeText(value)

  if (!pattern.test(normalized)) {
    throw new Error(`Invalid ${label}.`)
  }

  return normalized
}

function toNonNegativeInteger(value) {
  const numericValue = Number(value)

  return Number.isInteger(numericValue) && numericValue >= 0 ?
      numericValue
    : 0
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function toIsoFromBigQueryMillis(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null
  }

  return new Date(numericValue).toISOString()
}

function normalizeDataset(datasetJson) {
  if (!datasetJson || typeof datasetJson !== 'object') {
    return null
  }

  const datasetReference = datasetJson.datasetReference ?? {}

  return {
    id: normalizeText(datasetJson.id),
    projectId: normalizeText(datasetReference.projectId),
    datasetId: normalizeText(datasetReference.datasetId),
    location: normalizeText(datasetJson.location),
    creationTime: toIsoFromBigQueryMillis(
      datasetJson.creationTime
    ),
    lastModifiedTime: toIsoFromBigQueryMillis(
      datasetJson.lastModifiedTime
    )
  }
}

function normalizeTables(tablesJson) {
  if (!Array.isArray(tablesJson)) {
    return []
  }

  return tablesJson
    .map(table => {
      const tableReference = table?.tableReference ?? {}
      const tableId = normalizeText(tableReference.tableId)

      return {
        tableId,
        type: normalizeText(table?.type, 'UNKNOWN'),
        creationTime: toIsoFromBigQueryMillis(
          table?.creationTime
        )
      }
    })
    .filter(table => table.tableId)
    .sort((a, b) => a.tableId.localeCompare(b.tableId))
}

function createAlert(severity, code, message, next) {
  return { severity, code, message, next }
}

function summarizeTables(tables) {
  const eventTables = tables.filter(table =>
    /^events_\d{8}$/.test(table.tableId)
  )
  const intradayTables = tables.filter(table =>
    /^events_intraday_\d{8}$/.test(table.tableId)
  )
  const latestEventTable = eventTables.at(-1)?.tableId ?? null
  const latestIntradayTable =
    intradayTables.at(-1)?.tableId ?? null

  return {
    totalTables: tables.length,
    eventTables: eventTables.length,
    intradayTables: intradayTables.length,
    latestEventTable,
    latestIntradayTable
  }
}

function normalizePurchaseQuality(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  return {
    totalPurchaseEvents: toNonNegativeInteger(
      value.total_purchase_events
    ),
    missingTransactionId: toNonNegativeInteger(
      value.missing_transaction_id
    ),
    missingUserIdentifier: toNonNegativeInteger(
      value.missing_user_identifier
    ),
    missingSessionId: toNonNegativeInteger(
      value.missing_session_id
    ),
    duplicateTransactionIds: toNonNegativeInteger(
      value.duplicate_transaction_ids
    ),
    duplicatePurchaseEvents: toNonNegativeInteger(
      value.duplicate_purchase_events
    ),
    noncanonicalTransactionId: toNonNegativeInteger(
      value.noncanonical_transaction_id
    ),
    missingRevenue: toNonNegativeInteger(value.missing_revenue),
    missingItems: toNonNegativeInteger(value.missing_items)
  }
}

export function buildGa4BigQueryReadinessReport(
  input,
  options = {}
) {
  const generatedAt =
    options.generatedAt ?? new Date().toISOString()
  const projectId = options.projectId ?? DEFAULT_PROJECT_ID
  const datasetId = options.datasetId ?? DEFAULT_DATASET_ID
  const propertyId = options.propertyId ?? DEFAULT_PROPERTY_ID
  const dataset = normalizeDataset(input.dataset)
  const tables = normalizeTables(input.tables)
  const tableSummary = summarizeTables(tables)
  const purchaseQuality = normalizePurchaseQuality(
    input.purchaseQuality
  )
  const purchaseQualityTableSuffixes =
    Array.isArray(input.purchaseQualityTableSuffixes) ?
      input.purchaseQualityTableSuffixes.filter(value =>
        /^\d{8}$/.test(value)
      )
    : []
  const alerts = []

  if (!dataset) {
    alerts.push(
      createAlert(
        'critical',
        'ga4_bigquery_dataset_missing',
        `BigQuery dataset ${projectId}:${datasetId} does not exist or is not readable.`,
        'Wait for GA4 daily export to create the dataset, then rerun this report before creating Supabase BigQuery wrapper/read models.'
      )
    )
  } else if (
    tableSummary.eventTables === 0 &&
    tableSummary.intradayTables === 0
  ) {
    alerts.push(
      createAlert(
        'warning',
        'ga4_bigquery_events_tables_missing',
        `BigQuery dataset ${projectId}:${datasetId} exists, but no GA4 events_* or events_intraday_* tables were found.`,
        'Wait for the first GA4 export table before creating curated session, campaign, landing page or funnel models.'
      )
    )
  } else if (input.purchaseQualityError) {
    alerts.push(
      createAlert(
        'critical',
        'ga4_bigquery_purchase_quality_unreadable',
        'GA4 purchase-quality rows could not be read from BigQuery.',
        'Restore read access to the GA4 export and rerun the report before treating purchase diagnostics as resolved.'
      )
    )
  }

  if (purchaseQuality) {
    if (purchaseQuality.missingTransactionId > 0) {
      alerts.push(
        createAlert(
          'critical',
          'ga4_purchase_transaction_id_missing',
          `${purchaseQuality.missingTransactionId} purchase event(s) have no transaction_id.`,
          'Identify and retire the sender that emits purchases without the canonical Shopify transaction ID.'
        )
      )
    }

    if (purchaseQuality.missingUserIdentifier > 0) {
      alerts.push(
        createAlert(
          'critical',
          'ga4_purchase_user_identifier_missing',
          `${purchaseQuality.missingUserIdentifier} purchase event(s) have neither user_pseudo_id nor user_id.`,
          'Require at least one valid Google Analytics user identifier on every server purchase.'
        )
      )
    }

    if (purchaseQuality.missingSessionId > 0) {
      alerts.push(
        createAlert(
          'warning',
          'ga4_purchase_session_id_missing',
          `${purchaseQuality.missingSessionId} purchase event(s) have no positive ga_session_id.`,
          'Preserve the browser session ID through checkout and map it to the Data Manager event.'
        )
      )
    }

    if (purchaseQuality.duplicateTransactionIds > 0) {
      alerts.push(
        createAlert(
          'warning',
          'ga4_purchase_transaction_id_duplicate',
          `${purchaseQuality.duplicateTransactionIds} transaction ID(s) occur more than once, adding ${purchaseQuality.duplicatePurchaseEvents} raw duplicate purchase event(s).`,
          'Confirm browser and server copies use the same transaction ID and verify deduplication in processed GA4 reports.'
        )
      )
    }

    if (purchaseQuality.noncanonicalTransactionId > 0) {
      alerts.push(
        createAlert(
          'warning',
          'ga4_purchase_transaction_id_noncanonical',
          `${purchaseQuality.noncanonicalTransactionId} purchase event(s) do not use shopify_order_<numeric-id>.`,
          'Normalize every Shopify purchase source to the canonical Data Manager transaction ID format.'
        )
      )
    }

    if (purchaseQuality.missingRevenue > 0) {
      alerts.push(
        createAlert(
          'warning',
          'ga4_purchase_revenue_missing',
          `${purchaseQuality.missingRevenue} purchase event(s) have no positive purchase revenue.`,
          'Map the authoritative Shopify order value and currency before dispatch.'
        )
      )
    }

    if (purchaseQuality.missingItems > 0) {
      alerts.push(
        createAlert(
          'warning',
          'ga4_purchase_items_missing',
          `${purchaseQuality.missingItems} purchase event(s) contain no items.`,
          'Map the authoritative Shopify line items before dispatch.'
        )
      )
    }
  }

  return {
    generatedAt,
    mode: 'read-only',
    mutationPerformed: false,
    ok: alerts.length === 0,
    propertyId,
    projectId,
    datasetId,
    datasetExists: !!dataset,
    dataset,
    tableSummary,
    purchaseQualityTableSuffixes,
    purchaseQuality,
    alerts
  }
}

export function formatGa4BigQueryReadinessReport(report) {
  const lines = [
    'Utekos GA4 BigQuery readiness report',
    `Generated at: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Mutation performed: ${report.mutationPerformed ? 'yes' : 'no'}`,
    '',
    'Target',
    `- GA4 property: ${report.propertyId}`,
    `- BigQuery dataset: ${report.projectId}:${report.datasetId}`,
    '',
    'Dataset',
    `- exists: ${report.datasetExists ? 'yes' : 'no'}`
  ]

  if (report.dataset) {
    lines.push(
      `- location: ${report.dataset.location || 'unknown'}`,
      `- created: ${report.dataset.creationTime || 'unknown'}`,
      `- modified: ${report.dataset.lastModifiedTime || 'unknown'}`
    )
  }

  lines.push(
    '',
    'Tables',
    `- total: ${report.tableSummary.totalTables}`,
    `- events_*: ${report.tableSummary.eventTables}`,
    `- events_intraday_*: ${report.tableSummary.intradayTables}`,
    `- latest events_*: ${report.tableSummary.latestEventTable ?? 'none'}`,
    `- latest events_intraday_*: ${report.tableSummary.latestIntradayTable ?? 'none'}`,
    '',
    'Purchase quality'
  )

  if (report.purchaseQuality) {
    lines.push(
      `- table suffixes: ${report.purchaseQualityTableSuffixes.join(', ') || 'none'}`,
      `- purchase events: ${report.purchaseQuality.totalPurchaseEvents}`,
      `- missing transaction_id: ${report.purchaseQuality.missingTransactionId}`,
      `- missing user identifier: ${report.purchaseQuality.missingUserIdentifier}`,
      `- missing ga_session_id: ${report.purchaseQuality.missingSessionId}`,
      `- duplicate transaction IDs: ${report.purchaseQuality.duplicateTransactionIds}`,
      `- raw duplicate purchase events: ${report.purchaseQuality.duplicatePurchaseEvents}`,
      `- noncanonical transaction IDs: ${report.purchaseQuality.noncanonicalTransactionId}`,
      `- missing purchase revenue: ${report.purchaseQuality.missingRevenue}`,
      `- missing items: ${report.purchaseQuality.missingItems}`
    )
  } else {
    lines.push('- unavailable')
  }

  lines.push('', 'Alerts')

  if (report.alerts.length === 0) {
    lines.push('- none')
  } else {
    report.alerts.forEach(alert => {
      lines.push(
        `- ${alert.severity.toUpperCase()} ${alert.code}: ${alert.message}`
      )
      lines.push(`  next: ${alert.next}`)
    })
  }

  return lines.join('\n')
}

async function runBqJson(args) {
  const { stdout } = await execFileAsync('bq', args, {
    maxBuffer: 1024 * 1024 * 10
  })

  return parseJson(stdout, null)
}

async function readPurchaseQuality({
  projectId,
  datasetId,
  tables
}) {
  const tableSuffixes = tables
    .filter(table => /^events_\d{8}$/.test(table.tableId))
    .slice(-3)
    .map(table => table.tableId.slice('events_'.length))

  if (tableSuffixes.length === 0) {
    return {
      purchaseQuality: null,
      purchaseQualityTableSuffixes: []
    }
  }

  const suffixList = tableSuffixes
    .map(value => `'${value}'`)
    .join(', ')
  const query = `
WITH purchases AS (
  SELECT
    CASE
      WHEN NULLIF(TRIM(ecommerce.transaction_id), '') IS NULL THEN NULL
      WHEN LOWER(TRIM(ecommerce.transaction_id)) IN ('(not set)', 'not set') THEN NULL
      ELSE TRIM(ecommerce.transaction_id)
    END AS transaction_id,
    user_pseudo_id,
    user_id,
    (SELECT ANY_VALUE(value.int_value) FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id,
    ecommerce.purchase_revenue AS purchase_revenue,
    ARRAY_LENGTH(items) AS item_count
  FROM \`${projectId}.${datasetId}.events_*\`
  WHERE _TABLE_SUFFIX IN (${suffixList})
    AND event_name = 'purchase'
),
transaction_counts AS (
  SELECT transaction_id, COUNT(*) AS event_count
  FROM purchases
  WHERE NULLIF(TRIM(transaction_id), '') IS NOT NULL
  GROUP BY transaction_id
)
SELECT
  COUNT(*) AS total_purchase_events,
  COUNTIF(NULLIF(TRIM(transaction_id), '') IS NULL) AS missing_transaction_id,
  COUNTIF(NULLIF(TRIM(user_pseudo_id), '') IS NULL AND NULLIF(TRIM(user_id), '') IS NULL) AS missing_user_identifier,
  COUNTIF(ga_session_id IS NULL OR ga_session_id <= 0) AS missing_session_id,
  (SELECT COUNTIF(event_count > 1) FROM transaction_counts) AS duplicate_transaction_ids,
  (SELECT COALESCE(SUM(GREATEST(event_count - 1, 0)), 0) FROM transaction_counts) AS duplicate_purchase_events,
  COUNTIF(
    NULLIF(TRIM(transaction_id), '') IS NOT NULL
    AND NOT REGEXP_CONTAINS(transaction_id, r'^shopify_order_[0-9]+$')
  ) AS noncanonical_transaction_id,
  COUNTIF(purchase_revenue IS NULL OR purchase_revenue <= 0) AS missing_revenue,
  COUNTIF(item_count IS NULL OR item_count = 0) AS missing_items
FROM purchases
`
  const rows = await runBqJson([
    '--project_id',
    projectId,
    'query',
    '--format=prettyjson',
    '--use_legacy_sql=false',
    query
  ])

  return {
    purchaseQuality:
      Array.isArray(rows) ? (rows[0] ?? null) : null,
    purchaseQualityTableSuffixes: tableSuffixes
  }
}

async function readBigQueryState({ projectId, datasetId }) {
  const target = `${projectId}:${datasetId}`

  try {
    const dataset = await runBqJson([
      '--project_id',
      projectId,
      'show',
      '--format=prettyjson',
      target
    ])
    const tables = await runBqJson([
      '--project_id',
      projectId,
      'ls',
      '--format=prettyjson',
      target
    ])

    let qualityState

    try {
      qualityState = await readPurchaseQuality({
        projectId,
        datasetId,
        tables: normalizeTables(tables)
      })
    } catch (error) {
      qualityState = {
        purchaseQuality: null,
        purchaseQualityTableSuffixes: [],
        purchaseQualityError:
          error instanceof Error ? error.message : String(error)
      }
    }

    return { dataset, tables, ...qualityState }
  } catch (error) {
    return {
      dataset: null,
      tables: [],
      error:
        error instanceof Error ? error.message : String(error)
    }
  }
}

async function main() {
  const projectId = requireMatchingText(
    normalizeText(
      process.env.GA4_BIGQUERY_PROJECT_ID,
      DEFAULT_PROJECT_ID
    ),
    PROJECT_ID_PATTERN,
    'GA4 BigQuery project ID'
  )
  const datasetId = requireMatchingText(
    normalizeText(
      process.env.GA4_BIGQUERY_DATASET_ID,
      DEFAULT_DATASET_ID
    ),
    DATASET_ID_PATTERN,
    'GA4 BigQuery dataset ID'
  )
  const propertyId = requireMatchingText(
    normalizeText(
      process.env.GA4_PROPERTY_ID,
      DEFAULT_PROPERTY_ID
    ),
    /^\d+$/,
    'GA4 property ID'
  )
  const state = await readBigQueryState({ projectId, datasetId })
  const report = buildGa4BigQueryReadinessReport(state, {
    projectId,
    datasetId,
    propertyId
  })

  console.log(formatGa4BigQueryReadinessReport(report))

  if (getCliFlag('--json')) {
    console.log(JSON.stringify(report, null, 2))
  }

  if (
    getCliFlag('--fail-on-alerts') &&
    report.alerts.length > 0
  ) {
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
