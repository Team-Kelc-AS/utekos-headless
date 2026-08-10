#!/usr/bin/env node

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server'

import { collectMicrosoftAdsAccountAudit } from '../microsoft-ads/audit-account.mjs'
import { analyzeMicrosoftAdsAccountHealth } from '../microsoft-ads/health/account-health.mjs'
import { analyzeMicrosoftAdsMerchantHealth } from '../microsoft-ads/health/merchant-health.mjs'
import { analyzeMicrosoftAdsTrackingHealth } from '../microsoft-ads/health/tracking-health.mjs'
import { refreshMicrosoftAdsAccessToken } from '../microsoft-ads/lib/auth.mjs'
import {
  assertMicrosoftAdsRequirements,
  getConfiguredMicrosoftAdsAccountIds,
  loadMicrosoftAdsConfig,
  selectMicrosoftAdsAccountConfig
} from '../microsoft-ads/lib/config.mjs'
import { redactMicrosoftAdsSecrets } from '../microsoft-ads/lib/http.mjs'
import { createMicrosoftAdsReportingClient } from '../microsoft-ads/lib/reporting.mjs'
import {
  MICROSOFT_ADS_TOOL_CONTRACTS,
  MICROSOFT_ADS_TOOL_CONTRACT_VERSION,
  normalizeMicrosoftAdsFullAuditForWire,
  normalizeMicrosoftAdsRecommendation,
  parseMicrosoftAdsToolOutput,
  summarizeMicrosoftAdsAudit
} from './microsoft-ads-tool-contracts.mjs'
import {
  buildMicrosoftAdsReportRequest,
  createMicrosoftAdsAuditCache,
  rankMicrosoftAdsDiagnosisFindings,
  sanitizeMicrosoftAdsReportResult
} from './microsoft-ads-operator-core.mjs'

export const UTEKOS_MICROSOFT_ADS_MCP_TOOLS = Object.freeze([
  'microsoft_ads_account_snapshot',
  'microsoft_ads_account_health',
  'microsoft_ads_tracking_health',
  'microsoft_ads_merchant_health',
  'microsoft_ads_diagnose',
  'microsoft_ads_recommendations',
  'microsoft_ads_report'
])

const BASE_AUTH_REQUIRED_FIELDS = Object.freeze([
  'developerToken',
  'clientId',
  'clientSecret',
  'refreshToken',
  'customerId',
  'accountId'
])

export function createUtekosMicrosoftAdsMcpServer({
  collectAudit = collectMicrosoftAdsAccountAudit,
  analyzeAccountHealth = analyzeMicrosoftAdsAccountHealth,
  analyzeTrackingHealth = analyzeMicrosoftAdsTrackingHealth,
  analyzeMerchantHealth = analyzeMicrosoftAdsMerchantHealth,
  loadConfig = loadMicrosoftAdsConfig,
  assertRequirements = assertMicrosoftAdsRequirements,
  refreshAccessToken = refreshMicrosoftAdsAccessToken,
  createReportingClient = createMicrosoftAdsReportingClient,
  fetchImpl = globalThis.fetch,
  auditCacheTtlMs = 30_000,
  clock = Date.now
} = {}) {
  let sessionRefreshToken = null

  const getEffectiveConfig = accountId => {
    const loadedConfig = loadConfig()
    const config = sessionRefreshToken
      ? { ...loadedConfig, refreshToken: sessionRefreshToken }
      : loadedConfig

    return selectMicrosoftAdsAccountConfig(config, accountId)
  }

  const rememberRotatedRefreshToken = token => {
    if (typeof token === 'string' && token.trim()) {
      sessionRefreshToken = token.trim()
    }
  }

  const auditCaches = new Map()
  const getAuditCache = accountId => {
    const config = getEffectiveConfig(accountId)
    const cacheKey = config.accountId

    if (!auditCaches.has(cacheKey)) {
      auditCaches.set(
        cacheKey,
        createMicrosoftAdsAuditCache({
          ttlMs: auditCacheTtlMs,
          now: clock,
          collect: async () =>
            collectAudit({
              config: getEffectiveConfig(cacheKey),
              fetchImpl,
              onRefreshTokenRotated: rememberRotatedRefreshToken
            })
        })
      )
    }

    return auditCaches.get(cacheKey)
  }

  const getAudit = ({ accountId, refresh = false }) =>
    getAuditCache(accountId).get({ refresh })

  const server = new McpServer(
    {
      name: 'utekos-microsoft-ads',
      title: 'Utekos Microsoft Ads Operator',
      version: '1.2.0',
      description:
        'Evidence-backed multi-account Microsoft Advertising operator for Utekos account, tracking, Merchant Center, recommendations, reporting, and diagnosis.',
      websiteUrl: 'https://utekos.no'
    },
    {
      instructions: [
        'Use account_health for broad Microsoft Advertising delivery and account problems.',
        'Use tracking_health when UET, conversion goals, attribution, browser events, or UET CAPI are involved.',
        'Use merchant_health for Microsoft Merchant Center, catalog, feed, product eligibility, warnings, and disapprovals.',
        'Use diagnose to rank evidence-backed health findings against a natural-language problem statement.',
        'Use report for detailed Reporting v13 breakdowns that are not already present in the account audit.',
        'Every tool accepts an optional accountId. Omit it for the primary account; only explicitly configured account IDs are allowed.',
        'Microsoft recommendations are evidence inputs, not automatic truth; compare them with measured performance and health findings.'
      ].join(' ')
    }
  )

  server.registerTool(
    'microsoft_ads_account_snapshot',
    { ...MICROSOFT_ADS_TOOL_CONTRACTS.microsoft_ads_account_snapshot },
    safeTool('microsoft_ads_account_snapshot', async ({ accountId, refresh = false, detail = 'full' }) => {
      const audit = await getAudit({ accountId, refresh })
      return detail === 'summary'
        ? summarizeMicrosoftAdsAudit(audit)
        : normalizeMicrosoftAdsFullAuditForWire(audit)
    })
  )

  server.registerTool(
    'microsoft_ads_account_health',
    { ...MICROSOFT_ADS_TOOL_CONTRACTS.microsoft_ads_account_health },
    safeTool('microsoft_ads_account_health', async ({ accountId, refresh = false }) => {
      const audit = await getAudit({ accountId, refresh })
      return analyzeAccountHealth(audit)
    })
  )

  server.registerTool(
    'microsoft_ads_tracking_health',
    { ...MICROSOFT_ADS_TOOL_CONTRACTS.microsoft_ads_tracking_health },
    safeTool('microsoft_ads_tracking_health', async ({ accountId, refresh = false }) => {
      const audit = await getAudit({ accountId, refresh })
      return analyzeTrackingHealth(audit)
    })
  )

  server.registerTool(
    'microsoft_ads_merchant_health',
    { ...MICROSOFT_ADS_TOOL_CONTRACTS.microsoft_ads_merchant_health },
    safeTool('microsoft_ads_merchant_health', async ({ accountId, refresh = false }) => {
      const audit = await getAudit({ accountId, refresh })
      return analyzeMerchantHealth(audit)
    })
  )

  server.registerTool(
    'microsoft_ads_diagnose',
    { ...MICROSOFT_ADS_TOOL_CONTRACTS.microsoft_ads_diagnose },
    safeTool('microsoft_ads_diagnose', async ({
      query,
      accountId,
      area = 'auto',
      refresh = false,
      maxFindings = 10
    }) => {
      const audit = await getAudit({ accountId, refresh })
      const healthByArea = collectHealthByArea({
        audit,
        area,
        analyzeAccountHealth,
        analyzeTrackingHealth,
        analyzeMerchantHealth
      })
      const findings = Object.entries(healthByArea).flatMap(([scope, health]) =>
        (health?.findings ?? []).map(finding => ({
          ...finding,
          healthScope: scope
        }))
      )
      const ranked = rankMicrosoftAdsDiagnosisFindings(query, findings, {
        limit: maxFindings
      })

      return {
        query,
        requestedArea: area,
        auditFinishedAt: audit?.finishedAt ?? null,
        health: Object.fromEntries(
          Object.entries(healthByArea).map(([scope, health]) => [
            scope,
            {
              status: health?.status ?? 'unknown',
              summary: health?.summary ?? null,
              coverage: health?.coverage ?? null
            }
          ])
        ),
        findingCount: findings.length,
        matches: ranked
      }
    })
  )

  server.registerTool(
    'microsoft_ads_recommendations',
    { ...MICROSOFT_ADS_TOOL_CONTRACTS.microsoft_ads_recommendations },
    safeTool('microsoft_ads_recommendations', async ({ accountId, refresh = false, types, limit = 100 }) => {
      const audit = await getAudit({ accountId, refresh })
      const source = audit?.adInsight?.recommendations ?? {}
      const requestedTypes = types ? new Set(types) : null
      const items = Array.isArray(source.items) ? source.items : []
      const filtered = requestedTypes
        ? items.filter(item =>
            requestedTypes.has(
              item?.RecommendationType ?? item?.Type ?? 'Unknown'
            )
          )
        : items
      const selected = filtered.slice(0, limit)

      return {
        ok: source.ok ?? audit?.adInsight?.ok ?? false,
        sourceCount: source.count ?? items.length,
        matchedCount: filtered.length,
        returnedCount: selected.length,
        byType: summarizeRecommendationsByType(filtered),
        error: source.error ?? null,
        items: selected.map(normalizeMicrosoftAdsRecommendation)
      }
    })
  )

  server.registerTool(
    'microsoft_ads_report',
    { ...MICROSOFT_ADS_TOOL_CONTRACTS.microsoft_ads_report },
    safeTool('microsoft_ads_report', async input => {
      const config = getEffectiveConfig(input.accountId)
      assertRequirements(config, BASE_AUTH_REQUIRED_FIELDS)
      assertAllowedReportScope(input.scope, loadConfig())

      const auth = await refreshAccessToken(config, { fetchImpl })

      if (auth.refreshTokenRotated && auth.refreshToken) {
        rememberRotatedRefreshToken(auth.refreshToken)
      }

      const effectiveConfig = auth.refreshTokenRotated && auth.refreshToken
        ? { ...config, refreshToken: auth.refreshToken }
        : config
      const reporting = createReportingClient({
        config: effectiveConfig,
        accessToken: auth.accessToken,
        fetchImpl
      })
      const reportRequest = buildMicrosoftAdsReportRequest(
        input,
        effectiveConfig,
        clock
      )
      const result = await reporting.generateReport(reportRequest, {
        rowLimit: input.rowLimit ?? 250
      })

      return {
        request: {
          type: reportRequest.Type,
          aggregation: reportRequest.Aggregation,
          columns: reportRequest.Columns,
          scope: reportRequest.Scope,
          time: reportRequest.Time
        },
        result: sanitizeMicrosoftAdsReportResult(result)
      }
    })
  )

  return {
    server,
    auditCache: getAuditCache(),
    auditCaches,
    getAuditCache,
    getEffectiveConfig,
    clearAuditCache: () => {
      for (const cache of auditCaches.values()) {
        cache.clear()
      }
    }
  }
}

async function main() {
  const { server } = createUtekosMicrosoftAdsMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Utekos Microsoft Ads MCP server running on stdio')
}

function safeTool(toolName, handler) {
  return async args => {
    try {
      const result = await handler(args ?? {})
      return toToolResult(toolName, result)
    } catch (error) {
      const message = redactMicrosoftAdsSecrets(
        error instanceof Error ? error.message : String(error)
      )

      return {
        content: [{ type: 'text', text: message }],
        isError: true
      }
    }
  }
}

function toToolResult(toolName, value) {
  const structuredContent = parseMicrosoftAdsToolOutput(
    toolName,
    normalizeStructuredContent(value)
  )

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent, null, 2)
      }
    ],
    structuredContent,
    _meta: {
      'no.utekos/contractVersion': MICROSOFT_ADS_TOOL_CONTRACT_VERSION,
      'no.utekos/tool': toolName
    }
  }
}

function normalizeStructuredContent(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  return { result: value }
}

function collectHealthByArea({
  audit,
  area,
  analyzeAccountHealth,
  analyzeTrackingHealth,
  analyzeMerchantHealth
}) {
  if (area === 'account') {
    return { account: analyzeAccountHealth(audit) }
  }

  if (area === 'tracking') {
    return { tracking: analyzeTrackingHealth(audit) }
  }

  if (area === 'merchant') {
    return { merchant: analyzeMerchantHealth(audit) }
  }

  return {
    account: analyzeAccountHealth(audit),
    tracking: analyzeTrackingHealth(audit),
    merchant: analyzeMerchantHealth(audit)
  }
}

function summarizeRecommendationsByType(items) {
  return countBy(
    items,
    item => item?.RecommendationType ?? item?.Type ?? 'Unknown'
  )
}

function countBy(items, selector) {
  const counts = {}

  for (const item of items ?? []) {
    const key = String(selector(item))
    counts[key] = (counts[key] ?? 0) + 1
  }

  return counts
}

function assertAllowedReportScope(scope, config) {
  if (!scope) {
    return
  }

  const allowedAccountIds = new Set(getConfiguredMicrosoftAdsAccountIds(config))
  const scopedAccountIds = collectReportScopeAccountIds(scope)
  const forbiddenAccountId = scopedAccountIds.find(
    accountId => !allowedAccountIds.has(accountId)
  )

  if (forbiddenAccountId) {
    throw new Error(
      `Microsoft Advertising report scope account ${forbiddenAccountId} is not in the configured account allowlist.`
    )
  }
}

function collectReportScopeAccountIds(value, key = '') {
  if (Array.isArray(value)) {
    return value.flatMap(item => collectReportScopeAccountIds(item, key))
  }

  if (!value || typeof value !== 'object') {
    if (/^AccountIds?$/i.test(key) && /^\d+$/.test(String(value ?? ''))) {
      return [String(value)]
    }

    return []
  }

  return Object.entries(value).flatMap(([childKey, childValue]) =>
    collectReportScopeAccountIds(childValue, childKey)
  )
}

function isDirectExecution() {
  return Boolean(
    process.argv[1] &&
      path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
  )
}

if (isDirectExecution()) {
  main().catch(error => {
    console.error(
      redactMicrosoftAdsSecrets(
        error instanceof Error ? error.stack ?? error.message : String(error)
      )
    )
    process.exitCode = 1
  })
}
