import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const hasRepoRuntime =
  fs.existsSync(path.join(root, 'node_modules', 'zod')) &&
  fs.existsSync(path.join(root, 'scripts/microsoft-ads/lib/http.mjs')) &&
  fs.existsSync(path.join(root, 'scripts/microsoft-ads/lib/config.mjs'))

const repoTest = (name, fn) => test(name, { skip: !hasRepoRuntime }, fn)

repoTest('Reporting handles Pending/null followed by Success/null as a valid empty report', async () => {
  const { createMicrosoftAdsReportingClient } = await import(
    '../scripts/microsoft-ads/lib/reporting.mjs'
  )

  const responses = [
    { ReportRequestId: 'request-1' },
    {
      ReportRequestStatus: {
        Status: 'Pending',
        ReportDownloadUrl: null
      }
    },
    {
      ReportRequestStatus: {
        Status: 'Success',
        ReportDownloadUrl: null
      }
    }
  ]

  const fetchImpl = async () =>
    new Response(JSON.stringify(responses.shift()), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })

  const client = createMicrosoftAdsReportingClient({
    config: {
      environment: 'production',
      developerToken: 'developer-token',
      customerId: '1',
      accountId: '2'
    },
    accessToken: 'access-token',
    fetchImpl,
    pollIntervalMs: 0,
    maxPollAttempts: 3,
    sleepImpl: async () => {}
  })

  const result = await client.generateReport(
    {
      Type: 'CampaignPerformanceReportRequest',
      Aggregation: 'Summary',
      Columns: ['AccountId', 'CampaignId'],
      Scope: { AccountIds: ['2'] },
      Time: { PredefinedTime: 'Last7Days' }
    },
    { intervalMs: 0, attempts: 3, rowLimit: 5 }
  )

  assert.equal(result.ok, true)
  assert.equal(result.empty, true)
  assert.equal(result.status.Status, 'Success')
  assert.equal(result.status.ReportDownloadUrl, null)
  assert.equal(result.rowCount, 0)
  assert.deepEqual(result.rows, [])
})

repoTest('snapshot wire mappers strip raw account drift and validate both summary and full shapes', async () => {
  const {
    normalizeMicrosoftAdsFullAuditForWire,
    summarizeMicrosoftAdsAudit
  } = await import('../scripts/mcp/microsoft-ads-tool-contracts.mjs')

  const audit = createAuditFixture()
  audit.account = {
    environment: 'production',
    customerId: '254835341',
    accountId: '188365141',
    merchantStoreId: '50039313',
    uetTagId: '97247724',
    credentials: {
      developerTokenPresent: true,
      clientIdPresent: true,
      clientSecretPresent: true,
      accessTokenPresent: false,
      refreshTokenPresent: true,
      uetCapiTokenPresent: true,
      futureUnknownCredentialFlag: true
    },
    futureUnknownAccountField: 'ignored'
  }

  const full = normalizeMicrosoftAdsFullAuditForWire(audit)
  const summary = summarizeMicrosoftAdsAudit(audit)

  assert.equal(full.account.credentials.developerTokenPresent, true)
  assert.equal('futureUnknownAccountField' in full.account, false)
  assert.equal('futureUnknownCredentialFlag' in full.account.credentials, false)
  assert.equal(summary.account.accountId, '188365141')
  assert.equal(summary.campaigns.count, 1)
})

repoTest('tracking health trusts runtime Microsoft UET evidence over stale source heuristics', async () => {
  const { analyzeMicrosoftAdsTrackingHealth } = await import(
    '../scripts/microsoft-ads/health/tracking-health.mjs'
  )

  const audit = createAuditFixture()
  audit.localImplementation = {
    providerQueue: {
      serverQueueIncludesMicrosoft: false,
      serverRetryIncludesMicrosoft: false,
      serverDirectIncludesMicrosoft: false,
      providerTypeDeclaration: 'unknown',
      matchingFiles: []
    },
    providerDispatchEvidence: {
      ok: true,
      reason: null,
      lookbackDays: 30,
      provider: 'microsoft_uet',
      rowCount: 360,
      providerConfirmed: true,
      firstSeenAt: '2026-07-17T07:25:18.183Z',
      lastSeenAt: '2026-08-07T20:22:25.019Z',
      acceptedCount: 6,
      skippedCount: 354,
      failedCount: 0,
      byStatus: { skipped_unqualified: 354, accepted_unverified: 6 },
      byDispatchMode: { server_retry: 352, server_direct: 8 },
      bySkipReason: { missing_msclkid: 354 },
      bySkipReasonLastSeenAt: { missing_msclkid: '2026-08-07T20:22:25.019Z' },
      bySkipReasonAndEventName: { missing_msclkid: { add_to_cart: 173, begin_checkout: 173, purchase: 8 } },
      byEventName: { add_to_cart: 173, begin_checkout: 173, purchase: 14 }
    },
    productPurchaseGoal: {
      cApiEndpointPresent: true,
      cApiRequiresToken: true,
      cApiRequiresMsclkid: true
    }
  }
  audit.report = {
    ok: true,
    totals: { clicks: 100, allConversionsQualified: 0 }
  }

  const result = analyzeMicrosoftAdsTrackingHealth(audit)
  const codes = result.findings.map(finding => finding.code)

  assert.ok(codes.includes('MICROSOFT_UET_DISPATCH_SKIPPED_MISSING_MSCLKID'))
  assert.equal(codes.includes('MICROSOFT_PROVIDER_QUEUE_NOT_CONFIRMED'), false)
  assert.equal(result.metrics.providerDispatchConfirmed, true)
  assert.equal(result.metrics.missingMsclkidSkipCount, 354)
})

repoTest('tracking health reports the current missing Microsoft identifier reason', async () => {
  const { analyzeMicrosoftAdsTrackingHealth } = await import(
    '../scripts/microsoft-ads/health/tracking-health.mjs'
  )

  const audit = createAuditFixture()
  audit.localImplementation = {
    providerDispatchEvidence: {
      ok: true,
      reason: null,
      lookbackDays: 30,
      provider: 'microsoft_uet',
      rowCount: 3,
      providerConfirmed: true,
      acceptedCount: 1,
      skippedCount: 2,
      failedCount: 0,
      bySkipReason: { missing_microsoft_uet_identifier: 2 },
      bySkipReasonLastSeenAt: {
        missing_microsoft_uet_identifier: '2026-08-10T12:00:00.000Z'
      },
      bySkipReasonAndEventName: {
        missing_microsoft_uet_identifier: {
          add_to_cart: 1,
          purchase: 1
        }
      }
    },
    productPurchaseGoal: {
      cApiEndpointPresent: true,
      cApiRequiresToken: true,
      cApiRequiresMsclkid: false
    }
  }
  audit.report = {
    ok: true,
    totals: { clicks: 100, allConversionsQualified: 0 }
  }

  const result = analyzeMicrosoftAdsTrackingHealth(audit)
  const finding = result.findings.find(
    candidate =>
      candidate.code ===
      'MICROSOFT_UET_DISPATCH_SKIPPED_MISSING_IDENTIFIER'
  )

  assert.ok(finding)
  assert.equal(
    result.metrics.missingMicrosoftIdentifierSkipCount,
    2
  )
  assert.equal(result.metrics.missingMsclkidSkipCount, 0)
})

repoTest('full snapshot wire mapper tolerates report payloads carrying undefined values', async () => {
  const { normalizeMicrosoftAdsFullAuditForWire } = await import(
    '../scripts/mcp/microsoft-ads-tool-contracts.mjs'
  )

  const audit = createAuditFixture()
  audit.report = {
    ok: true,
    empty: false,
    rowCount: 2,
    rows: [{ CampaignId: '1', Clicks: '10' }],
    totals: { clicks: 10 },
    allRows: undefined,
    status: { Status: 'Success', nested: { dropped: undefined } }
  }

  const full = normalizeMicrosoftAdsFullAuditForWire(audit)

  assert.equal('allRows' in full.report, false)
  assert.equal('dropped' in full.report.status.nested, false)
  assert.equal(full.report.rowCount, 2)
  assert.equal(JSON.parse(JSON.stringify(full.report)).totals.clicks, 10)
})

repoTest('dispatch evidence reader queries ops.provider_dispatch_attempts over direct Postgres', async () => {
  const { readMicrosoftUetDispatchEvidence } = await import(
    '../scripts/microsoft-ads/evidence/supabase-tracking-evidence.mjs'
  )

  const queries = []
  let ended = false
  const rows = [
    {
      event_name: 'purchase',
      status: 'accepted_unverified',
      dispatch_mode: 'server_retry',
      skip_reason: null,
      created_at: '2026-08-01T10:00:00.000Z'
    },
    {
      event_name: 'add_to_cart',
      status: 'skipped_unqualified',
      dispatch_mode: 'server_retry',
      skip_reason: 'missing_msclkid',
      created_at: '2026-08-02T10:00:00.000Z'
    }
  ]

  const createSqlImpl = (url, options) => {
    assert.equal(url, 'postgres://warehouse.invalid/testdb')
    assert.equal(options.max, 1)
    return Object.assign(
      async (strings, ...values) => {
        queries.push({ text: strings.join('?'), values })
        return rows
      },
      { end: async () => { ended = true } }
    )
  }

  const result = await readMicrosoftUetDispatchEvidence({
    lookbackDays: 30,
    now: () => new Date('2026-08-08T08:00:00.000Z'),
    processEnv: {
      SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING:
        'postgres://warehouse.invalid/testdb'
    },
    envFiles: [],
    createSqlImpl
  })

  assert.equal(result.ok, true)
  assert.equal(result.providerConfirmed, true)
  assert.equal(result.rowCount, 2)
  assert.equal(result.acceptedCount, 1)
  assert.equal(result.skippedCount, 1)
  assert.equal(result.bySkipReason.missing_msclkid, 1)
  assert.equal(ended, true)
  assert.match(queries[0].text, /from ops\.provider_dispatch_attempts/)
  assert.match(queries[0].text, /provider = 'microsoft_uet'/)
  assert.deepEqual(queries[0].values, ['2026-07-09T08:00:00.000Z', 5000])
})

repoTest('dispatch evidence reader fails closed without a warehouse URL and on query errors', async () => {
  const { readMicrosoftUetDispatchEvidence } = await import(
    '../scripts/microsoft-ads/evidence/supabase-tracking-evidence.mjs'
  )

  const missingUrl = await readMicrosoftUetDispatchEvidence({
    processEnv: {},
    envFiles: [],
    createSqlImpl: () => {
      throw new Error('must not connect without a warehouse URL')
    }
  })

  assert.equal(missingUrl.ok, false)
  assert.equal(missingUrl.reason, 'supabase_warehouse_url_unavailable')
  assert.equal(missingUrl.providerConfirmed, false)

  const queryFailure = await readMicrosoftUetDispatchEvidence({
    processEnv: {
      SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING:
        'postgres://warehouse.invalid/testdb'
    },
    envFiles: [],
    createSqlImpl: () =>
      Object.assign(
        async () => {
          throw new Error('relation "ops.provider_dispatch_attempts" does not exist')
        },
        { end: async () => {} }
      )
  })

  assert.equal(queryFailure.ok, false)
  assert.match(queryFailure.reason, /^supabase_read_failed:/)
  assert.equal(queryFailure.rowCount, 0)
})

function createAuditFixture() {
  return {
    ok: true,
    auditVersion: 2,
    startedAt: '2026-08-08T06:00:00.000Z',
    finishedAt: '2026-08-08T06:00:01.000Z',
    account: {
      environment: 'production',
      customerId: '254835341',
      accountId: '188365141',
      merchantStoreId: '50039313',
      uetTagId: '97247724'
    },
    credentialReadiness: {
      developerTokenPresent: true,
      clientIdPresent: true,
      clientSecretPresent: true,
      refreshTokenPresent: true,
      accessTokenRefreshed: true,
      refreshTokenRotated: false,
      rotatedRefreshTokenPersistenceRequired: false,
      uetCapiTokenPresent: true,
      uetCapiTokenAliasesChecked: ['MICROSOFT_UET_CAPI_ACCESS_TOKEN'],
      cApiAuthKeyReadSkipped: true,
      cApiAuthKeySkipReason: 'read intentionally skipped'
    },
    criticalReads: {
      accountProperties: true,
      uetTags: true,
      conversionGoals: true,
      campaigns: true,
      reporting: true,
      shoppingContent: true,
      adInsight: true
    },
    accountProperties: { ok: true, byName: { MSCLKIDAutoTaggingEnabled: true } },
    uetTags: { ok: true, count: 1, tags: [{ trackingStatus: 'Active' }] },
    conversionGoals: { ok: true, count: 1, goals: [{ id: '1', name: 'Purchase', trackingStatus: 'RecordingConversions' }] },
    campaigns: { ok: true, count: 1, activeCount: 1, campaigns: [{ id: '1', name: 'Campaign', status: 'Active', type: 'Search' }] },
    shoppingContent: { ok: true, storeId: '50039313', catalogs: { count: 1 }, products: { count: 16 }, productStatuses: { disapprovedCount: 12, warningCount: 0 } },
    report: { ok: true, totals: { clicks: 0, allConversionsQualified: 0 } },
    adInsight: { ok: true, recommendations: { count: 0, byType: {}, items: [] } },
    localImplementation: {},
    findings: [],
    readFailures: [],
    sources: ['https://learn.microsoft.com/advertising/']
  }
}
