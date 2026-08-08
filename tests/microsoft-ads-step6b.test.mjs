import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  buildMicrosoftAdsReportRequest,
  MICROSOFT_ADS_REPORT_TIME_PERIODS,
  rankMicrosoftAdsDiagnosisFindings
} from '../scripts/mcp/microsoft-ads-operator-core.mjs'
import {
  summarizeMicrosoftUetDispatchAttempts
} from '../scripts/microsoft-ads/evidence/summarize-microsoft-uet-dispatch-attempts.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

test('Reporting accepts a nullable ReportDownloadUrl and models Success without rows as empty success', () => {
  const source = read('scripts/microsoft-ads/lib/reporting.mjs')

  assert.match(
    source,
    /ReportDownloadUrl:\s*z\.string\(\)\.nullable\(\)\.optional\(\)/
  )
  assert.match(
    source,
    /if \(!completed\.status\?\.ReportDownloadUrl\)[\s\S]*?ok:\s*true,[\s\S]*?empty:\s*true,[\s\S]*?rowCount:\s*0,[\s\S]*?rows:\s*\[\]/
  )
})

test('Microsoft UET production evidence aggregates missing_msclkid across dispatch modes', () => {
  const rows = [
    ...Array.from({ length: 346 }, (_, index) => ({
      event_name: index % 2 === 0 ? 'add_to_cart' : 'begin_checkout',
      status: 'skipped_unqualified',
      dispatch_mode: 'server_retry',
      skip_reason: 'missing_msclkid',
      created_at: '2026-08-07T20:22:25.019Z'
    })),
    ...Array.from({ length: 8 }, () => ({
      event_name: 'purchase',
      status: 'skipped_unqualified',
      dispatch_mode: 'server_direct',
      skip_reason: 'missing_msclkid',
      created_at: '2026-07-17T07:25:18.183Z'
    })),
    ...Array.from({ length: 6 }, () => ({
      event_name: 'purchase',
      status: 'accepted_unverified',
      dispatch_mode: 'server_retry',
      skip_reason: null,
      created_at: '2026-07-22T13:37:50.435Z'
    }))
  ]

  const result = summarizeMicrosoftUetDispatchAttempts(rows, { lookbackDays: 30 })

  assert.equal(result.provider, 'microsoft_uet')
  assert.equal(result.providerConfirmed, true)
  assert.equal(result.rowCount, 360)
  assert.equal(result.bySkipReason.missing_msclkid, 354)
  assert.equal(result.bySkipReasonAndEventName.missing_msclkid.purchase, 8)
  assert.equal(result.skippedCount, 354)
  assert.equal(result.acceptedCount, 6)
  assert.equal(result.byDispatchMode.server_retry, 352)
  assert.equal(result.byDispatchMode.server_direct, 8)
})

test('diagnose ranks explicit zero-conversion intent above Merchant findings', () => {
  const findings = [
    {
      severity: 'high',
      code: 'PAID_CLICKS_WITH_ZERO_QUALIFIED_CONVERSIONS',
      area: 'conversion_tracking',
      title: 'Paid clicks are present but qualified conversions are zero',
      summary: 'Microsoft Reporting shows paid clicks and zero qualified conversions.',
      evidence: [],
      remediation: { steps: [] }
    },
    {
      severity: 'high',
      code: 'MERCHANT_PRODUCTS_DISAPPROVED',
      area: 'merchant',
      title: 'Merchant Center products are disapproved',
      summary: 'Merchant Center contains product disapprovals.',
      evidence: [],
      remediation: { steps: [] }
    }
  ]

  const ranked = rankMicrosoftAdsDiagnosisFindings(
    'klikk men ingen kvalifiserte konverteringer + Merchant Center',
    findings
  )

  assert.equal(ranked[0].code, 'PAID_CLICKS_WITH_ZERO_QUALIFIED_CONVERSIONS')
  assert.equal(ranked[0].diagnosticMatch.primaryIntent, 'conversion_tracking')
  assert.ok(ranked[0].diagnosticScore > ranked[1].diagnosticScore)
})

test('snapshot uses the canonical contract mappers for both summary and full output', () => {
  const server = read('scripts/mcp/utekos-microsoft-ads-server.mjs')
  const contracts = read('scripts/mcp/microsoft-ads-tool-contracts.mjs')

  assert.match(server, /summarizeMicrosoftAdsAudit\(audit\)/)
  assert.match(server, /normalizeMicrosoftAdsFullAuditForWire\(audit\)/)
  assert.doesNotMatch(server, /function\s+summarizeAudit\s*\(/)
  assert.match(contracts, /export function summarizeMicrosoftAdsAudit\(audit\)/)
  assert.match(contracts, /export function normalizeMicrosoftAdsFullAuditForWire\(audit\)/)
  assert.match(contracts, /credentials:\s*z\.object\(\{[\s\S]*?developerTokenPresent:/)
})

test('tracking health gives runtime provider evidence precedence over source-path heuristics', () => {
  const source = read('scripts/microsoft-ads/health/tracking-health.mjs')
  const auditSource = read('scripts/microsoft-ads/audit-account.mjs')
  const evidenceReader = read('scripts/microsoft-ads/evidence/supabase-tracking-evidence.mjs')

  assert.match(source, /MICROSOFT_UET_DISPATCH_SKIPPED_MISSING_MSCLKID/)
  assert.match(source, /runtimeProviderConfirmed/)
  assert.match(
    source,
    /!runtimeProviderConfirmed\s*&&\s*providerQueue\?\.serverQueueIncludesMicrosoft === false/
  )
  assert.match(auditSource, /providerDispatchEvidence:\s*dispatchEvidence/)
  assert.match(evidenceReader, /from ops\.provider_dispatch_attempts/)
  assert.match(evidenceReader, /provider = 'microsoft_uet'/)
  assert.match(evidenceReader, /SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING/)
  assert.doesNotMatch(evidenceReader, /\.schema\('ops'\)/)
})

test('campaign report result omits allRows instead of carrying an undefined key', () => {
  const source = read('scripts/microsoft-ads/lib/reporting.mjs')

  assert.doesNotMatch(source, /allRows:\s*undefined/)
  assert.match(source, /const \{ allRows, \.\.\.safeResult \} = result/)
})

test('report request builder rejects invalid ReportTimePeriod values before any network call', () => {
  const reportInput = {
    reportType: 'CampaignPerformanceReportRequest',
    aggregation: 'Summary',
    columns: ['AccountId', 'Clicks']
  }
  const config = { accountId: '188365141' }

  assert.throws(
    () =>
      buildMicrosoftAdsReportRequest(
        { ...reportInput, predefinedTime: 'Last7Days' },
        config
      ),
    /not a valid ReportTimePeriod value/
  )

  const request = buildMicrosoftAdsReportRequest(
    { ...reportInput, predefinedTime: 'LastSevenDays' },
    config
  )

  assert.equal(request.Time.PredefinedTime, 'LastSevenDays')
  assert.ok(MICROSOFT_ADS_REPORT_TIME_PERIODS.includes('Last30Days'))
  assert.equal(MICROSOFT_ADS_REPORT_TIME_PERIODS.includes('Last7Days'), false)
})

test('live doctor exercises every public tool and both snapshot modes', () => {
  const source = read('scripts/mcp/doctor-utekos-microsoft-ads-server.mjs')
  const toolNames = [
    'microsoft_ads_account_snapshot',
    'microsoft_ads_account_health',
    'microsoft_ads_tracking_health',
    'microsoft_ads_merchant_health',
    'microsoft_ads_diagnose',
    'microsoft_ads_recommendations',
    'microsoft_ads_report'
  ]

  for (const toolName of toolNames) {
    assert.match(source, new RegExp(`name: '${toolName}'`))
  }

  assert.match(source, /detail:\s*'summary'/)
  assert.match(source, /detail:\s*'full'/)
  assert.match(source, /CampaignPerformanceReportRequest/)
  assert.match(source, /returnOnlyCompleteData:\s*false/)
})
