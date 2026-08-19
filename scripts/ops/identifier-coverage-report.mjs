#!/usr/bin/env node

import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import postgres from 'postgres'

import {
  getWarehouseUrl,
  redactOperationalText
} from './provider-dispatch-feedback-report.mjs'

dotenv.config({ path: '.env.local', quiet: true })

const DEFAULT_THRESHOLDS = {
  maxHistoricalMissingGaClientIdRate: 0.25,
  maxHistoricalMissingPaidClickIdRate: 0.25,
  minCheckoutSnapshots: 1,
  maxReadyForProviderRepairOrders: 0,
  maxUnresolvedDeadLetters: 0,
  maxMicrosoftMissingCapiTokenPurchases: 0
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
    maxHistoricalMissingGaClientIdRate: getEnvNumber(
      env,
      'OPS_IDENTIFIER_MAX_HISTORICAL_MISSING_GA_CLIENT_ID_RATE',
      DEFAULT_THRESHOLDS.maxHistoricalMissingGaClientIdRate
    ),
    maxHistoricalMissingPaidClickIdRate: getEnvNumber(
      env,
      'OPS_IDENTIFIER_MAX_HISTORICAL_MISSING_PAID_CLICK_ID_RATE',
      DEFAULT_THRESHOLDS.maxHistoricalMissingPaidClickIdRate
    ),
    minCheckoutSnapshots: getEnvNumber(
      env,
      'OPS_IDENTIFIER_MIN_CHECKOUT_SNAPSHOTS',
      DEFAULT_THRESHOLDS.minCheckoutSnapshots
    ),
    maxReadyForProviderRepairOrders: getEnvNumber(
      env,
      'OPS_IDENTIFIER_MAX_READY_FOR_PROVIDER_REPAIR_ORDERS',
      DEFAULT_THRESHOLDS.maxReadyForProviderRepairOrders
    ),
    maxUnresolvedDeadLetters: getEnvNumber(
      env,
      'OPS_IDENTIFIER_MAX_UNRESOLVED_DEAD_LETTERS',
      DEFAULT_THRESHOLDS.maxUnresolvedDeadLetters
    ),
    maxMicrosoftMissingCapiTokenPurchases: getEnvNumber(
      env,
      'OPS_IDENTIFIER_MAX_MICROSOFT_MISSING_CAPI_TOKEN_PURCHASES',
      DEFAULT_THRESHOLDS.maxMicrosoftMissingCapiTokenPurchases
    )
  }
}

function toNonNegativeNumber(value) {
  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
  }

  return 0
}

function toNullableIsoString(value) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function normalizeText(value, fallback = 'unknown') {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

function redactOperationalSummary(value) {
  return redactOperationalText(value).replace(/\s+/g, ' ').trim()
}

function createCoverageMetric(total, present) {
  const safeTotal = toNonNegativeNumber(total)
  const safePresent = Math.min(toNonNegativeNumber(present), safeTotal)
  const missing = Math.max(0, safeTotal - safePresent)

  return {
    present: safePresent,
    missing,
    rate: safeTotal > 0 ? safePresent / safeTotal : 0,
    missingRate: safeTotal > 0 ? missing / safeTotal : 0
  }
}

function normalizeOrderCoverage(row = {}) {
  const totalOrders = toNonNegativeNumber(row.total_orders)

  return {
    totalOrders,
    paidOrders: toNonNegativeNumber(row.paid_orders),
    totalRevenue: toNonNegativeNumber(row.total_revenue),
    firstProcessedAt: toNullableIsoString(row.first_processed_at),
    lastProcessedAt: toNullableIsoString(row.last_processed_at),
    signals: {
      gaClientId: createCoverageMetric(totalOrders, row.ga_client_id),
      gaSessionId: createCoverageMetric(totalOrders, row.ga_session_id),
      fbp: createCoverageMetric(totalOrders, row.fbp),
      fbc: createCoverageMetric(totalOrders, row.fbc),
      metaBrowserIds: createCoverageMetric(totalOrders, row.meta_browser_ids),
      googleClickId: createCoverageMetric(totalOrders, row.google_click_id),
      microsoftClickId: createCoverageMetric(totalOrders, row.microsoft_click_id),
      paidClickId: createCoverageMetric(totalOrders, row.paid_click_id)
    }
  }
}

function normalizeSnapshotCoverage(row = {}) {
  const totalSnapshots = toNonNegativeNumber(row.total_snapshots)

  return {
    totalSnapshots,
    firstCapturedAt: toNullableIsoString(row.first_captured_at),
    lastCapturedAt: toNullableIsoString(row.last_captured_at),
    signals: {
      gaClientId: createCoverageMetric(totalSnapshots, row.ga_client_id),
      gaSessionId: createCoverageMetric(totalSnapshots, row.ga_session_id),
      fbp: createCoverageMetric(totalSnapshots, row.fbp),
      fbc: createCoverageMetric(totalSnapshots, row.fbc),
      externalId: createCoverageMetric(totalSnapshots, row.external_id),
      emailHash: createCoverageMetric(totalSnapshots, row.email_hash),
      googleClickId: createCoverageMetric(totalSnapshots, row.google_click_id),
      microsoftClickId: createCoverageMetric(totalSnapshots, row.microsoft_click_id),
      paidClickId: createCoverageMetric(totalSnapshots, row.paid_click_id)
    }
  }
}

function normalizeGapRows(rows) {
  return rows
    .map(row => ({
      gap: normalizeText(row.primary_attribution_gap, 'unknown'),
      orders: toNonNegativeNumber(row.order_count),
      revenue: toNonNegativeNumber(row.revenue),
      gaClientId: toNonNegativeNumber(row.ga_client_id),
      metaBrowserIds: toNonNegativeNumber(row.meta_browser_ids),
      googleClickId: toNonNegativeNumber(row.google_click_id),
      microsoftClickId: toNonNegativeNumber(row.microsoft_click_id),
      paidClickId: toNonNegativeNumber(row.paid_click_id),
      averageMatchSignalCount: toNonNegativeNumber(row.average_match_signal_count)
    }))
    .sort((left, right) => right.orders - left.orders || left.gap.localeCompare(right.gap))
}

function normalizeProviderPurchaseRows(rows) {
  return rows
    .map(row => ({
      provider: normalizeText(row.provider),
      status: normalizeText(row.status),
      dispatchMode: normalizeText(row.dispatch_mode),
      skipReason: redactOperationalSummary(row.skip_reason ?? 'n/a'),
      rows: toNonNegativeNumber(row.row_count),
      latestUpdatedAt: toNullableIsoString(row.latest_updated_at),
      latestProcessedAt: toNullableIsoString(row.latest_processed_at)
    }))
    .sort((left, right) => (
      left.provider.localeCompare(right.provider)
      || left.status.localeCompare(right.status)
      || left.dispatchMode.localeCompare(right.dispatchMode)
      || left.skipReason.localeCompare(right.skipReason)
    ))
}

function normalizeDeadLetterRows(rows) {
  return rows
    .map(row => ({
      source: normalizeText(row.source),
      reason: redactOperationalSummary(row.reason),
      unresolvedCount: toNonNegativeNumber(row.unresolved_count),
      totalCount: toNonNegativeNumber(row.total_count),
      latestCreatedAt: toNullableIsoString(row.latest_created_at),
      latestResolvedAt: toNullableIsoString(row.latest_resolved_at)
    }))
    .sort((left, right) => (
      right.unresolvedCount - left.unresolvedCount
      || right.totalCount - left.totalCount
      || left.source.localeCompare(right.source)
      || left.reason.localeCompare(right.reason)
    ))
}

function findGap(primaryGaps, gapName) {
  return primaryGaps.find(row => row.gap === gapName) ?? null
}

function getMissingCapiTokenPurchases(providerPurchaseRows) {
  return providerPurchaseRows
    .filter(row => (
      row.provider === 'microsoft_uet'
      && row.skipReason === 'missing_capi_token'
    ))
    .reduce((total, row) => total + row.rows, 0)
}

function getLatestProviderPurchaseRow(providerPurchaseRows, provider) {
  return providerPurchaseRows
    .filter(row => row.provider === provider)
    .toSorted((left, right) => {
      const leftTime = Date.parse(left.latestUpdatedAt ?? '')
      const rightTime = Date.parse(right.latestUpdatedAt ?? '')
      return (Number.isFinite(rightTime) ? rightTime : 0)
        - (Number.isFinite(leftTime) ? leftTime : 0)
    })[0] ?? null
}

function describeProviderPurchaseRow(row) {
  if (!row) {
    return 'no current Microsoft UET purchase row found'
  }

  return [
    row.status,
    row.dispatchMode,
    row.skipReason === 'n/a' ? null : row.skipReason
  ].filter(Boolean).join(' | ')
}

function buildAlerts(report) {
  const alerts = []
  const thresholds = report.thresholds
  const missingGaClientIdGap = findGap(report.historicalShopify.primaryGaps, 'missing_ga_client_id')
  const missingPaidClickIdGap = findGap(report.historicalShopify.primaryGaps, 'missing_paid_click_id')
  const readyForProviderRepairGap = findGap(
    report.historicalShopify.primaryGaps,
    'ready_for_provider_repair'
  )
  const totalOrders = report.historicalShopify.coverage.totalOrders
  const missingGaClientIdRate = totalOrders > 0
    ? (missingGaClientIdGap?.orders ?? 0) / totalOrders
    : 0
  const missingPaidClickIdRate = totalOrders > 0
    ? (missingPaidClickIdGap?.orders ?? 0) / totalOrders
    : 0
  const unresolvedDeadLetters = report.deadLetters.reduce(
    (total, row) => total + row.unresolvedCount,
    0
  )
  const microsoftMissingCapiTokenPurchases = getMissingCapiTokenPurchases(
    report.providerPurchaseDelivery
  )
  const latestMicrosoftUetPurchase = getLatestProviderPurchaseRow(
    report.providerPurchaseDelivery,
    'microsoft_uet'
  )

  if (report.checkoutSnapshots.coverage.totalSnapshots < thresholds.minCheckoutSnapshots) {
    alerts.push({
      severity: 'warning',
      code: 'checkout_attribution_snapshots_below_threshold',
      message: `Checkout attribution snapshots ${report.checkoutSnapshots.coverage.totalSnapshots} are below threshold ${thresholds.minCheckoutSnapshots}; runtime snapshot capture is deployed but not data-proven yet.`
    })
  }

  if (missingGaClientIdRate > thresholds.maxHistoricalMissingGaClientIdRate) {
    alerts.push({
      severity: 'critical',
      code: 'historical_missing_ga_client_id_rate',
      message: `Historical Shopify orders missing GA client id ${(missingGaClientIdRate * 100).toFixed(1)}% exceed threshold ${(thresholds.maxHistoricalMissingGaClientIdRate * 100).toFixed(1)}%.`
    })
  }

  if (missingPaidClickIdRate > thresholds.maxHistoricalMissingPaidClickIdRate) {
    alerts.push({
      severity: 'warning',
      code: 'historical_missing_paid_click_id_rate',
      message: `Historical Shopify orders missing paid click id ${(missingPaidClickIdRate * 100).toFixed(1)}% exceed threshold ${(thresholds.maxHistoricalMissingPaidClickIdRate * 100).toFixed(1)}%.`
    })
  }

  if (
    (readyForProviderRepairGap?.orders ?? 0)
    > thresholds.maxReadyForProviderRepairOrders
  ) {
    alerts.push({
      severity: 'warning',
      code: 'provider_repair_ready_orders_present',
      message: `${readyForProviderRepairGap.orders} Shopify order(s) are ready for provider repair and should be handled intentionally.`
    })
  }

  if (unresolvedDeadLetters > thresholds.maxUnresolvedDeadLetters) {
    alerts.push({
      severity: 'critical',
      code: 'unresolved_dead_letters_present',
      message: `Unresolved dead letters ${unresolvedDeadLetters} exceed threshold ${thresholds.maxUnresolvedDeadLetters}.`
    })
  }

  if (
    microsoftMissingCapiTokenPurchases
    > thresholds.maxMicrosoftMissingCapiTokenPurchases
  ) {
    const latestStatus = describeProviderPurchaseRow(latestMicrosoftUetPurchase)

    if (latestMicrosoftUetPurchase?.skipReason === 'missing_capi_token') {
      alerts.push({
        severity: 'critical',
        code: 'microsoft_uet_purchase_missing_capi_token',
        message: `${microsoftMissingCapiTokenPurchases} Microsoft UET purchase row(s) are skipped because the UET CAPI token is missing; latest Microsoft UET purchase status is ${latestStatus}.`
      })
    } else {
      alerts.push({
        severity: 'warning',
        code: 'microsoft_uet_purchase_missing_capi_token_historical',
        message: `${microsoftMissingCapiTokenPurchases} historical Microsoft UET purchase row(s) were skipped because the UET CAPI token was missing; latest Microsoft UET purchase status is ${latestStatus}.`
      })
    }
  }

  return alerts
}

export function buildIdentifierCoverageReport(input, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS
  const historicalCoverage = normalizeOrderCoverage(input.orderCoverageRows?.[0])
  const checkoutSnapshotCoverage = normalizeSnapshotCoverage(input.checkoutSnapshotRows?.[0])
  const primaryGaps = normalizeGapRows(input.primaryGapRows ?? [])
  const providerPurchaseDelivery = normalizeProviderPurchaseRows(
    input.providerPurchaseRows ?? []
  )
  const deadLetters = normalizeDeadLetterRows(input.deadLetterRows ?? [])
  const report = {
    generatedAt,
    mode: 'read-only',
    mutationPerformed: false,
    thresholds,
    historicalShopify: {
      coverage: historicalCoverage,
      primaryGaps
    },
    checkoutSnapshots: {
      coverage: checkoutSnapshotCoverage
    },
    providerPurchaseDelivery,
    deadLetters,
    alerts: []
  }

  report.alerts = buildAlerts(report)
  report.totals = {
    historicalOrders: historicalCoverage.totalOrders,
    checkoutSnapshots: checkoutSnapshotCoverage.totalSnapshots,
    unresolvedDeadLetters: deadLetters.reduce(
      (total, row) => total + row.unresolvedCount,
      0
    ),
    microsoftMissingCapiTokenPurchases: getMissingCapiTokenPurchases(
      providerPurchaseDelivery
    ),
    alertCount: report.alerts.length
  }

  return report
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

function formatCurrency(value) {
  return `NOK ${Number(value).toFixed(2)}`
}

function formatSignalLine(label, metric) {
  return `- ${label}: present=${metric.present}, missing=${metric.missing}, coverage=${formatPercent(metric.rate)}`
}

export function formatIdentifierCoverageReport(report) {
  const orderSignals = report.historicalShopify.coverage.signals
  const snapshotSignals = report.checkoutSnapshots.coverage.signals
  const lines = [
    'Utekos identifier coverage and purchase readiness report',
    `Generated at: ${report.generatedAt}`,
    'Mode: read-only',
    'Mutation performed: no',
    '',
    'Historical Shopify orders',
    `- orders: ${report.historicalShopify.coverage.totalOrders}`,
    `- paid orders: ${report.historicalShopify.coverage.paidOrders}`,
    `- revenue: ${formatCurrency(report.historicalShopify.coverage.totalRevenue)}`,
    `- window: ${report.historicalShopify.coverage.firstProcessedAt ?? 'n/a'} -> ${report.historicalShopify.coverage.lastProcessedAt ?? 'n/a'}`,
    formatSignalLine('GA client id', orderSignals.gaClientId),
    formatSignalLine('GA session id', orderSignals.gaSessionId),
    formatSignalLine('Meta fbp', orderSignals.fbp),
    formatSignalLine('Meta fbc', orderSignals.fbc),
    formatSignalLine('Meta browser ids', orderSignals.metaBrowserIds),
    formatSignalLine('Google paid click id', orderSignals.googleClickId),
    formatSignalLine('Microsoft msclkid', orderSignals.microsoftClickId),
    formatSignalLine('Any paid click id', orderSignals.paidClickId),
    '',
    'Primary attribution gaps'
  ]

  if (report.historicalShopify.primaryGaps.length === 0) {
    lines.push('- none')
  } else {
    for (const gap of report.historicalShopify.primaryGaps) {
      lines.push(
        `- ${gap.gap}: orders=${gap.orders}, revenue=${formatCurrency(gap.revenue)}, paid_click_id=${gap.paidClickId}, meta_browser_ids=${gap.metaBrowserIds}`
      )
    }
  }

  lines.push(
    '',
    'Checkout attribution snapshots',
    `- snapshots: ${report.checkoutSnapshots.coverage.totalSnapshots}`,
    `- window: ${report.checkoutSnapshots.coverage.firstCapturedAt ?? 'n/a'} -> ${report.checkoutSnapshots.coverage.lastCapturedAt ?? 'n/a'}`,
    formatSignalLine('GA client id', snapshotSignals.gaClientId),
    formatSignalLine('GA session id', snapshotSignals.gaSessionId),
    formatSignalLine('Meta fbp', snapshotSignals.fbp),
    formatSignalLine('Meta fbc', snapshotSignals.fbc),
    formatSignalLine('External id', snapshotSignals.externalId),
    formatSignalLine('Email hash', snapshotSignals.emailHash),
    formatSignalLine('Google paid click id', snapshotSignals.googleClickId),
    formatSignalLine('Microsoft msclkid', snapshotSignals.microsoftClickId),
    formatSignalLine('Any paid click id', snapshotSignals.paidClickId),
    '',
    'Provider purchase delivery'
  )

  if (report.providerPurchaseDelivery.length === 0) {
    lines.push('- none')
  } else {
    for (const row of report.providerPurchaseDelivery) {
      lines.push(
        `- ${row.provider} | ${row.status} | ${row.dispatchMode} | ${row.skipReason}: rows=${row.rows}, latest=${row.latestUpdatedAt ?? 'n/a'}`
      )
    }
  }

  lines.push('', 'Unresolved dead letters')

  const unresolvedDeadLetters = report.deadLetters.filter(row => row.unresolvedCount > 0)

  if (unresolvedDeadLetters.length === 0) {
    lines.push('- none')
  } else {
    for (const row of unresolvedDeadLetters) {
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

async function queryIdentifierCoverageRows(warehouseUrl) {
  const sql = postgres(warehouseUrl, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false
  })

  try {
    const orderCoverageRows = await sql`
      select
        count(*) as total_orders,
        count(*) filter (where financial_status = 'PAID') as paid_orders,
        coalesce(sum(total_price_amount), 0) as total_revenue,
        min(processed_at_shopify) as first_processed_at,
        max(processed_at_shopify) as last_processed_at,
        count(*) filter (where has_ga_client_id) as ga_client_id,
        count(*) filter (where ga_session_id is not null) as ga_session_id,
        count(*) filter (where fbp is not null) as fbp,
        count(*) filter (where fbc is not null) as fbc,
        count(*) filter (where has_meta_browser_ids) as meta_browser_ids,
        count(*) filter (where has_google_click_id) as google_click_id,
        count(*) filter (where has_microsoft_click_id) as microsoft_click_id,
        count(*) filter (where has_google_click_id or has_microsoft_click_id) as paid_click_id
      from commerce.shopify_order_attribution_readiness
    `

    const primaryGapRows = await sql`
      select
        primary_attribution_gap,
        count(*) as order_count,
        coalesce(sum(total_price_amount), 0) as revenue,
        count(*) filter (where has_ga_client_id) as ga_client_id,
        count(*) filter (where has_meta_browser_ids) as meta_browser_ids,
        count(*) filter (where has_google_click_id) as google_click_id,
        count(*) filter (where has_microsoft_click_id) as microsoft_click_id,
        count(*) filter (where has_google_click_id or has_microsoft_click_id) as paid_click_id,
        coalesce(avg(match_signal_count), 0) as average_match_signal_count
      from commerce.shopify_order_attribution_readiness
      group by primary_attribution_gap
      order by order_count desc, primary_attribution_gap
    `

    const checkoutSnapshotRows = await sql`
      select
        count(*) as total_snapshots,
        min(captured_at) as first_captured_at,
        max(captured_at) as last_captured_at,
        count(*) filter (where ga_client_id is not null) as ga_client_id,
        count(*) filter (where ga_session_id is not null) as ga_session_id,
        count(*) filter (where fbp is not null) as fbp,
        count(*) filter (where fbc is not null) as fbc,
        count(*) filter (where external_id is not null) as external_id,
        count(*) filter (where email_hash is not null) as email_hash,
        count(*) filter (
          where gclid is not null
             or gbraid is not null
             or wbraid is not null
             or dclid is not null
        ) as google_click_id,
        count(*) filter (where msclkid is not null) as microsoft_click_id,
        count(*) filter (
          where gclid is not null
             or gbraid is not null
             or wbraid is not null
             or dclid is not null
             or msclkid is not null
        ) as paid_click_id
      from marketing.checkout_attribution_snapshots
    `

    const providerPurchaseRows = await sql`
      select
        provider,
        status,
        dispatch_mode,
        coalesce(skip_reason, 'n/a') as skip_reason,
        count(*) as row_count,
        max(updated_at) as latest_updated_at,
        max(processed_at) as latest_processed_at
      from ops.provider_dispatch_attempts
      where event_name in ('Purchase', 'purchase')
      group by provider, status, dispatch_mode, coalesce(skip_reason, 'n/a')
      order by provider, status, dispatch_mode, skip_reason
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
      orderCoverageRows,
      primaryGapRows,
      checkoutSnapshotRows,
      providerPurchaseRows,
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
    getCliFlag('--fail-on-alerts') || process.env.OPS_IDENTIFIER_FAIL_ON_ALERTS === '1'

  if (!warehouseUrl) {
    console.error(
      'No Supabase tracking warehouse URL configured. Set SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING or SUPABASE_VERCEL_POSTGRES_URL.'
    )
    process.exitCode = 1
    return
  }

  const rows = await queryIdentifierCoverageRows(warehouseUrl)
  const report = buildIdentifierCoverageReport(rows, {
    thresholds: getThresholds()
  })

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    process.stdout.write(formatIdentifierCoverageReport(report))
  }

  if (failOnAlerts && report.alerts.length > 0) {
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
