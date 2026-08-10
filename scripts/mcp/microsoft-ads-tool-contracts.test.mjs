import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  MICROSOFT_ADS_TOOL_CONTRACTS,
  MICROSOFT_ADS_TOOL_CONTRACT_VERSION,
  microsoftAdsTrackingHealthOutputSchema,
  normalizeMicrosoftAdsFullAuditForWire
} from './microsoft-ads-tool-contracts.mjs'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const serverPath = path.join(root, 'scripts/mcp/utekos-microsoft-ads-server.mjs')
const contractPath = path.join(root, 'scripts/mcp/microsoft-ads-tool-contracts.mjs')
const findingPath = path.join(root, 'scripts/microsoft-ads/health/finding-schema.mjs')
const doctorPath = path.join(root, 'scripts/mcp/doctor-utekos-microsoft-ads-server.mjs')

const toolNames = [
  'microsoft_ads_account_snapshot',
  'microsoft_ads_account_health',
  'microsoft_ads_tracking_health',
  'microsoft_ads_merchant_health',
  'microsoft_ads_diagnose',
  'microsoft_ads_recommendations',
  'microsoft_ads_report'
]

test('canonical tool contract module covers all seven tools', () => {
  assert.equal(fs.existsSync(contractPath), true)
  const source = fs.readFileSync(contractPath, 'utf8')
  for (const name of toolNames) assert.match(source, new RegExp(name))
  assert.match(source, /outputSchema/)
  assert.match(source, /annotations/)
  assert.match(source, /no\.utekos\/contractVersion/)
  assert.match(source, /readOnlyHint:\s*true/)
  assert.match(source, /openWorldHint:\s*true/)
})

test('server registers contracts with output schemas and runtime validation', () => {
  const source = fs.readFileSync(serverPath, 'utf8')
  assert.match(source, /MICROSOFT_ADS_TOOL_CONTRACTS/)
  assert.match(source, /MICROSOFT_ADS_TOOL_CONTRACTS\.microsoft_ads_account_snapshot/)
  assert.match(source, /parseMicrosoftAdsToolOutput/)
  assert.match(source, /structuredContent/)
})

test('all tools accept only a digits-only configured account selector', () => {
  assert.equal(MICROSOFT_ADS_TOOL_CONTRACT_VERSION, '1.2.1')

  for (const name of toolNames) {
    const schema = MICROSOFT_ADS_TOOL_CONTRACTS[name].inputSchema
    const minimumInput = name === 'microsoft_ads_diagnose'
      ? { query: 'tracking status' }
      : name === 'microsoft_ads_report'
        ? { reportType: 'CampaignPerformanceReportRequest', columns: ['Clicks'] }
        : {}

    assert.equal(
      schema.safeParse({ ...minimumInput, accountId: '188445594' }).success,
      true,
      `${name} should accept the configured account selector`
    )
    assert.equal(
      schema.safeParse({ ...minimumInput, accountId: 'G120L495' }).success,
      false,
      `${name} should reject an account number in the accountId field`
    )
  }
})

test('tracking health output accepts the missing Microsoft identifier metric', () => {
  const result = microsoftAdsTrackingHealthOutputSchema.safeParse({
    scope: 'microsoft-ads:188365141',
    status: 'healthy',
    ok: true,
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      actionable: 0
    },
    coverage: { complete: true, checks: [] },
    metrics: {
      uetTagCount: 1,
      activeUetTagCount: 1,
      conversionGoalCount: 3,
      noRecentConversionGoalCount: 3,
      clicks: 0,
      allConversionsQualified: 0,
      msclkidAutoTaggingEnabled: true,
      uetCapiEndpointPresent: true,
      uetCapiTokenPresent: true,
      localCapiRequiresMsclkid: false,
      providerDispatchEvidenceAvailable: true,
      providerDispatchConfirmed: false,
      providerDispatchAttemptCount: 0,
      providerDispatchAcceptedCount: 0,
      providerDispatchSkippedCount: 0,
      providerDispatchFailedCount: 0,
      missingMsclkidSkipCount: 0,
      missingMicrosoftIdentifierSkipCount: 0
    },
    findings: []
  })

  assert.equal(result.success, true)
})

test('server keeps a separate audit cache for each selected account', () => {
  const source = fs.readFileSync(serverPath, 'utf8')
  assert.match(source, /const auditCaches = new Map\(\)/)
  assert.match(source, /selectMicrosoftAdsAccountConfig/)
  assert.match(source, /assertAllowedReportScope/)
})

test('stable health schemas no longer use unknown or passthrough', () => {
  const source = fs.readFileSync(findingPath, 'utf8')
  assert.doesNotMatch(source, /z\.unknown\(\)/)
  assert.doesNotMatch(source, /\.passthrough\(\)/)
  assert.match(source, /microsoftAdsJsonValueSchema/)
  assert.match(source, /\.strict\(\)/)
})

test('doctor verifies schema and metadata completeness rather than names only', () => {
  const source = fs.readFileSync(doctorPath, 'utf8')
  for (const field of ['outputSchema', 'annotations', 'readOnlyHint', 'openWorldHint', 'no.utekos/contractVersion']) {
    assert.match(source, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('recommendation and report contracts are deliberately bounded', () => {
  const source = fs.readFileSync(contractPath, 'utf8')
  for (const type of [
    'ADD_BROAD_MATCH_KEYWORD',
    'CAMPAIGN_BUDGET',
    'KEYWORD',
    'REMOVE_CONFLICTING_NEGATIVE_KEYWORD',
    'RESPONSIVE_SEARCH_AD',
    'RESPONSIVE_SEARCH_AD_ASSET'
  ]) assert.match(source, new RegExp(type))
  assert.match(source, /predefinedTime cannot be combined with custom dates/)
  assert.match(source, /customStartDate and customEndDate must be provided together/)
  assert.match(source, /ReportDownloadUrl|signed download URLs/)
})

test('tool metadata never embeds credential values or credential metadata keys', () => {
  const source = fs.readFileSync(contractPath, 'utf8')
  for (const forbidden of [
    'MICROSOFT_ADS_CLIENT_SECRET',
    'MICROSOFT_ADS_REFRESH_TOKEN',
    'MICROSOFT_ADS_DEVELOPER_TOKEN',
    'CONTROL_PLANE_API_KEY'
  ]) assert.doesNotMatch(source, new RegExp(forbidden))
})

test('full account snapshot strips signed report download URLs', () => {
  const timestamp = '2026-08-10T12:00:00.000Z'
  const normalized = normalizeMicrosoftAdsFullAuditForWire({
    ok: true,
    auditVersion: 2,
    startedAt: timestamp,
    finishedAt: timestamp,
    account: {
      environment: 'production',
      customerId: null,
      accountId: null,
      merchantStoreId: null,
      uetTagId: null,
      developerTokenPresent: false,
      clientIdPresent: false,
      clientSecretPresent: false,
      accessTokenPresent: false,
      refreshTokenPresent: false,
      uetCapiTokenPresent: false
    },
    credentialReadiness: {},
    criticalReads: {},
    report: {
      ok: true,
      empty: false,
      allRows: [{ secret: 'discarded' }],
      status: {
        Status: 'Success',
        ReportDownloadUrl: 'https://example.invalid/signed-report'
      }
    },
    sources: ['https://learn.microsoft.com/advertising/']
  })

  assert.deepEqual(normalized.report.status, { Status: 'Success' })
  assert.equal('allRows' in normalized.report, false)
  assert.doesNotMatch(JSON.stringify(normalized), /signed-report/)
})
