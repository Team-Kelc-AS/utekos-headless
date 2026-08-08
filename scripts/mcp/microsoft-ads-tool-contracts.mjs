import { z } from 'zod'
import {
  MICROSOFT_ADS_HEALTH_STATUSES,
  microsoftAdsHealthCoverageSchema,
  microsoftAdsHealthFindingSchema,
  microsoftAdsHealthSummarySchema,
  microsoftAdsJsonObjectSchema,
  microsoftAdsJsonValueSchema
} from '../microsoft-ads/health/finding-schema.mjs'
import { MICROSOFT_ADS_RECOMMENDATION_TYPES } from '../microsoft-ads/lib/ad-insight.mjs'

export const MICROSOFT_ADS_TOOL_CONTRACT_VERSION = '1.1.0'
export const MICROSOFT_ADS_SUPPORTED_RECOMMENDATION_TYPES = Object.freeze([
  'ADD_BROAD_MATCH_KEYWORD',
  'CAMPAIGN_BUDGET',
  'KEYWORD',
  'REMOVE_CONFLICTING_NEGATIVE_KEYWORD',
  'RESPONSIVE_SEARCH_AD',
  'RESPONSIVE_SEARCH_AD_ASSET'
])

export const MICROSOFT_ADS_TOOL_NAMES = Object.freeze([
  'microsoft_ads_account_snapshot',
  'microsoft_ads_account_health',
  'microsoft_ads_tracking_health',
  'microsoft_ads_merchant_health',
  'microsoft_ads_diagnose',
  'microsoft_ads_recommendations',
  'microsoft_ads_report'
])


if (
  MICROSOFT_ADS_SUPPORTED_RECOMMENDATION_TYPES.length !== MICROSOFT_ADS_RECOMMENDATION_TYPES.length ||
  MICROSOFT_ADS_SUPPORTED_RECOMMENDATION_TYPES.some(type => !MICROSOFT_ADS_RECOMMENDATION_TYPES.includes(type))
) {
  throw new Error('Microsoft Ads recommendation contract is out of sync with the Ad Insight client.')
}

const idSchema = z.union([z.string().trim().min(1), z.number()])
const nullableIdSchema = idSchema.nullable()
const isoDateTimeSchema = z.string().datetime({ offset: true })
const nullableIsoDateTimeSchema = isoDateTimeSchema.nullable()
const countSchema = z.number().int().nonnegative()
const countRecordSchema = z.record(z.string(), countSchema)
const nullableStringSchema = z.string().nullable()
const reportCellSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
const reportRowSchema = z.record(z.string(), reportCellSchema)

const safeAccountSchema = z.object({
  environment: z.enum(['production', 'sandbox']),
  customerId: z.string().nullable(),
  accountId: z.string().nullable(),
  merchantStoreId: z.string().nullable(),
  uetTagId: z.string().nullable(),
  credentials: z.object({
    developerTokenPresent: z.boolean(),
    clientIdPresent: z.boolean(),
    clientSecretPresent: z.boolean(),
    accessTokenPresent: z.boolean(),
    refreshTokenPresent: z.boolean(),
    uetCapiTokenPresent: z.boolean()
  }).strict()
}).strict()

const credentialReadinessSchema = z.object({
  developerTokenPresent: z.boolean(),
  clientIdPresent: z.boolean(),
  clientSecretPresent: z.boolean(),
  refreshTokenPresent: z.boolean(),
  accessTokenRefreshed: z.boolean(),
  refreshTokenRotated: z.boolean(),
  rotatedRefreshTokenPersistenceRequired: z.boolean(),
  uetCapiTokenPresent: z.boolean(),
  uetCapiTokenAliasesChecked: z.array(z.string()),
  cApiAuthKeyReadSkipped: z.boolean(),
  cApiAuthKeySkipReason: z.string()
}).strict()

const criticalReadsSchema = z.object({
  accountProperties: z.boolean(),
  uetTags: z.boolean(),
  conversionGoals: z.boolean(),
  campaigns: z.boolean(),
  reporting: z.boolean(),
  shoppingContent: z.boolean(),
  adInsight: z.boolean()
}).strict()

const readFailureSchema = z.object({
  name: z.string().trim().min(1),
  error: z.string().trim().min(1)
}).strict()

const auditFindingSchema = z.object({
  severity: z.enum(['critical','high','medium','low','info']),
  code: z.string().trim().min(1),
  area: z.string().trim().min(1),
  message: z.string().trim().min(1),
  entity: z.object({
    type: z.string().trim().min(1),
    id: idSchema.optional().nullable(),
    name: z.string().optional().nullable()
  }).strict().optional(),
  evidence: microsoftAdsJsonValueSchema.optional()
}).strict()

export const microsoftAdsFullAuditOutputSchema = z.object({
  ok: z.boolean(),
  auditVersion: z.number().int().positive(),
  startedAt: isoDateTimeSchema,
  finishedAt: isoDateTimeSchema,
  account: safeAccountSchema,
  credentialReadiness: credentialReadinessSchema,
  criticalReads: criticalReadsSchema,
  accountProperties: microsoftAdsJsonObjectSchema,
  uetTags: microsoftAdsJsonObjectSchema,
  conversionGoals: microsoftAdsJsonObjectSchema,
  campaigns: microsoftAdsJsonObjectSchema,
  shoppingContent: microsoftAdsJsonObjectSchema,
  report: microsoftAdsJsonObjectSchema,
  adInsight: microsoftAdsJsonObjectSchema,
  localImplementation: microsoftAdsJsonObjectSchema,
  findings: z.array(auditFindingSchema),
  readFailures: z.array(readFailureSchema),
  sources: z.array(z.string().url()).min(1)
}).strict()

export const microsoftAdsSnapshotSummaryOutputSchema = z.object({
  ok: z.boolean(),
  auditVersion: z.number().int().positive().nullable(),
  startedAt: nullableIsoDateTimeSchema,
  finishedAt: nullableIsoDateTimeSchema,
  account: safeAccountSchema.nullable(),
  credentialReadiness: credentialReadinessSchema.nullable(),
  criticalReads: criticalReadsSchema.nullable(),
  campaigns: z.object({ count: countSchema, activeCount: countSchema, byType: countRecordSchema }).strict(),
  uet: z.object({ count: countSchema, statuses: countRecordSchema }).strict(),
  conversionGoals: z.object({ count: countSchema, trackingStatuses: countRecordSchema }).strict(),
  merchant: z.object({
    ok: z.boolean(),
    storeId: nullableIdSchema,
    catalogCount: countSchema,
    productCount: countSchema,
    disapprovedCount: countSchema,
    warningCount: countSchema
  }).strict().nullable(),
  reportTotals: microsoftAdsJsonObjectSchema.nullable(),
  recommendations: z.object({ count: countSchema, byType: countRecordSchema }).strict(),
  readFailures: z.array(readFailureSchema),
  auditFindingCount: countSchema
}).strict()

const healthEnvelope = metricsSchema => z.object({
  scope: z.string().trim().min(1),
  status: z.enum(MICROSOFT_ADS_HEALTH_STATUSES),
  ok: z.boolean(),
  summary: microsoftAdsHealthSummarySchema,
  coverage: microsoftAdsHealthCoverageSchema,
  metrics: metricsSchema,
  findings: z.array(microsoftAdsHealthFindingSchema)
}).strict()

export const microsoftAdsAccountHealthOutputSchema = healthEnvelope(z.object({
  campaignCount: countSchema,
  activeCampaignCount: countSchema,
  impressions: z.number().nonnegative(),
  clicks: z.number().nonnegative(),
  spend: z.number().nonnegative(),
  recommendations: countSchema,
  performanceInsights: countSchema
}).strict())

export const microsoftAdsTrackingHealthOutputSchema = healthEnvelope(z.object({
  uetTagCount: countSchema,
  activeUetTagCount: countSchema,
  conversionGoalCount: countSchema,
  noRecentConversionGoalCount: countSchema,
  clicks: z.number().nonnegative(),
  allConversionsQualified: z.number().nonnegative(),
  msclkidAutoTaggingEnabled: z.boolean(),
  uetCapiEndpointPresent: z.boolean(),
  uetCapiTokenPresent: z.boolean(),
  localCapiRequiresMsclkid: z.boolean(),
  providerDispatchEvidenceAvailable: z.boolean(),
  providerDispatchConfirmed: z.boolean(),
  providerDispatchAttemptCount: countSchema,
  providerDispatchAcceptedCount: countSchema,
  providerDispatchSkippedCount: countSchema,
  providerDispatchFailedCount: countSchema,
  missingMsclkidSkipCount: countSchema
}).strict())

export const microsoftAdsMerchantHealthOutputSchema = healthEnvelope(z.object({
  activeShoppingCampaignCount: countSchema,
  merchantStoreIdPresent: z.boolean(),
  catalogCount: countSchema,
  productCount: countSchema,
  inStockCount: countSchema,
  outOfStockCount: countSchema,
  disapprovedCount: countSchema,
  warningStatusCount: countSchema
}).strict())

const diagnosisHealthSummarySchema = z.object({
  status: z.enum(MICROSOFT_ADS_HEALTH_STATUSES),
  summary: microsoftAdsHealthSummarySchema.nullable(),
  coverage: microsoftAdsHealthCoverageSchema.nullable()
}).strict()

const rankedFindingSchema = microsoftAdsHealthFindingSchema.extend({
  healthScope: z.enum(['account','tracking','merchant']),
  diagnosticScore: z.number().nonnegative(),
  diagnosticMatch: z.object({
    tokenOverlap: countSchema,
    queryTokenCount: countSchema,
    primaryIntent: z.enum(['general','conversion_tracking','merchant','delivery','budget','targeting']),
    matchedIntents: z.array(z.enum(['conversion_tracking','merchant','delivery','budget','targeting'])),
    intentAreaBonus: z.number().nonnegative(),
    intentCodeBonus: z.number().nonnegative()
  }).strict()
}).strict()

export const microsoftAdsDiagnoseOutputSchema = z.object({
  query: z.string().trim().min(2),
  requestedArea: z.enum(['auto','account','tracking','merchant']),
  auditFinishedAt: nullableIsoDateTimeSchema,
  health: z.object({
    account: diagnosisHealthSummarySchema.optional(),
    tracking: diagnosisHealthSummarySchema.optional(),
    merchant: diagnosisHealthSummarySchema.optional()
  }).strict(),
  findingCount: countSchema,
  matches: z.array(rankedFindingSchema)
}).strict()

const recommendationTypeSchema = z.enum(MICROSOFT_ADS_SUPPORTED_RECOMMENDATION_TYPES)
const recommendationOutputItemSchema = z.object({
  type: recommendationTypeSchema,
  payload: microsoftAdsJsonObjectSchema
}).strict()

export const microsoftAdsRecommendationsOutputSchema = z.object({
  ok: z.boolean(),
  sourceCount: countSchema,
  matchedCount: countSchema,
  returnedCount: countSchema,
  byType: countRecordSchema,
  error: nullableStringSchema,
  items: z.array(recommendationOutputItemSchema)
}).strict()

const reportStatusSchema = z.object({
  Status: z.enum(['Error', 'Pending', 'Success']).nullable()
}).strict()
const reportResultSchema = z.object({
  ok: z.boolean(),
  empty: z.boolean(),
  reportRequestId: z.string().optional(),
  status: reportStatusSchema.optional(),
  pollAttempts: countSchema.optional(),
  rowCount: countSchema.optional(),
  rows: z.array(reportRowSchema).optional()
}).strict()

export const microsoftAdsReportOutputSchema = z.object({
  request: z.object({
    type: z.string().trim().min(1),
    aggregation: z.string().trim().min(1),
    columns: z.array(z.string().trim().min(1)).min(1),
    scope: microsoftAdsJsonObjectSchema,
    time: microsoftAdsJsonObjectSchema
  }).strict(),
  result: reportResultSchema
}).strict()

const refreshInputSchema = z.object({
  refresh: z.boolean().optional().describe('Bypass the in-process audit cache and read Microsoft Ads again.')
}).strict()
const snapshotInputSchema = z.object({
  refresh: z.boolean().optional().describe('Bypass the in-process audit cache.'),
  detail: z.enum(['full','summary']).optional().describe('Return the full audit or a compact operational summary. Defaults to full.')
}).strict()
const diagnoseInputSchema = z.object({
  query: z.string().trim().min(2).max(1000).describe('Concrete Microsoft Ads problem or question to diagnose.'),
  area: z.enum(['auto','account','tracking','merchant']).optional().describe('Limit diagnosis to one health surface; auto combines all three.'),
  refresh: z.boolean().optional().describe('Bypass the audit cache before diagnosing.'),
  maxFindings: z.number().int().min(1).max(50).optional().describe('Maximum ranked findings to return. Defaults to 10.')
}).strict()
const recommendationsInputSchema = z.object({
  refresh: z.boolean().optional().describe('Bypass the audit cache before reading recommendations.'),
  types: z.array(recommendationTypeSchema).min(1).max(MICROSOFT_ADS_SUPPORTED_RECOMMENDATION_TYPES.length).optional().describe('Optional Microsoft recommendation type allowlist.'),
  limit: z.number().int().min(1).max(2000).optional().describe('Maximum recommendation items returned. Defaults to 100.')
}).strict()
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const reportInputSchema = z.object({
  reportType: z.string().trim().min(1).max(120).describe('Microsoft Reporting v13 request type, e.g. CampaignPerformanceReportRequest.'),
  aggregation: z.string().trim().min(1).max(80).optional().describe('Microsoft report aggregation. Defaults are resolved by the request builder.'),
  columns: z.array(z.string().trim().min(1).max(120)).min(1).max(200).describe('Exact Microsoft Reporting columns to request.'),
  predefinedTime: z.string().trim().min(1).max(80).optional().describe('Microsoft predefined reporting period. Do not combine with custom dates.'),
  customStartDate: dateSchema.optional().describe('Inclusive YYYY-MM-DD custom start date.'),
  customEndDate: dateSchema.optional().describe('Inclusive YYYY-MM-DD custom end date.'),
  reportTimeZone: z.string().trim().min(1).max(120).optional().describe('Microsoft Reporting time-zone enum value.'),
  filter: microsoftAdsJsonObjectSchema.optional().describe('Report-type-specific Microsoft filter object.'),
  scope: microsoftAdsJsonObjectSchema.optional().describe('Report-type-specific Microsoft scope. Defaults to the configured account.'),
  rowLimit: z.number().int().min(0).max(5000).optional().describe('Maximum downloaded rows returned to the agent. Defaults to 250.'),
  returnOnlyCompleteData: z.boolean().optional().describe('Require Microsoft to return only complete report data.')
}).strict().superRefine((value, ctx) => {
  const hasStart = Boolean(value.customStartDate)
  const hasEnd = Boolean(value.customEndDate)
  if (hasStart !== hasEnd) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'customStartDate and customEndDate must be provided together.' })
  if (value.predefinedTime && (hasStart || hasEnd)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'predefinedTime cannot be combined with custom dates.' })
})

const annotations = title => ({ title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true })
const meta = (area, freshness, sourceSystems) => ({
  'no.utekos/domain': 'paid-media.microsoft-ads',
  'no.utekos/area': area,
  'no.utekos/contractVersion': MICROSOFT_ADS_TOOL_CONTRACT_VERSION,
  'no.utekos/dataClassification': 'internal-commercial',
  'no.utekos/freshness': freshness,
  'no.utekos/sourceSystems': sourceSystems
})

export const MICROSOFT_ADS_TOOL_CONTRACTS = Object.freeze({
  microsoft_ads_account_snapshot: {
    title: 'Microsoft Ads Account Snapshot',
    description: 'Read the current Microsoft Advertising account snapshot across account settings, campaigns, UET, conversion goals, Merchant Center, reporting, Ad Insight, and verified local implementation evidence. Use summary for compact triage and full for forensic inspection.',
    inputSchema: snapshotInputSchema,
    outputSchema: z.union([microsoftAdsSnapshotSummaryOutputSchema, microsoftAdsFullAuditOutputSchema]),
    annotations: annotations('Microsoft Ads Account Snapshot'),
    _meta: meta('account','audit-cache-up-to-30s',['Microsoft Advertising Campaign Management','Microsoft Advertising Reporting','Microsoft Advertising Ad Insight','Microsoft Shopping Content','Utekos source evidence'])
  },
  microsoft_ads_account_health: {
    title: 'Microsoft Ads Account Health',
    description: 'Evaluate delivery and account-wide health using campaign structure, ads, keywords, budget evidence, Reporting metrics, Microsoft Performance Insights, recommendations, and diagnostic coverage.',
    inputSchema: refreshInputSchema,
    outputSchema: microsoftAdsAccountHealthOutputSchema,
    annotations: annotations('Microsoft Ads Account Health'),
    _meta: meta('account','audit-cache-up-to-30s',['Microsoft Advertising Campaign Management','Microsoft Advertising Reporting','Microsoft Advertising Ad Insight'])
  },
  microsoft_ads_tracking_health: {
    title: 'Microsoft Ads Tracking Health',
    description: 'Evaluate Microsoft Ads measurement health across UET, conversion goals, MSCLKID, browser/server event alignment, UET CAPI readiness, provider routing, and measured conversion evidence.',
    inputSchema: refreshInputSchema,
    outputSchema: microsoftAdsTrackingHealthOutputSchema,
    annotations: annotations('Microsoft Ads Tracking Health'),
    _meta: meta('tracking','audit-cache-up-to-30s',['Microsoft UET','Microsoft Advertising Campaign Management','Microsoft Advertising Reporting','Supabase ops.provider_dispatch_attempts','Utekos tracking implementation'])
  },
  microsoft_ads_merchant_health: {
    title: 'Microsoft Ads Merchant Health',
    description: 'Evaluate Microsoft Merchant Center and Shopping health across store configuration, catalogs, publishing, product inventory, stock, disapprovals, warnings, issue codes, target countries, and feed-label consistency.',
    inputSchema: refreshInputSchema,
    outputSchema: microsoftAdsMerchantHealthOutputSchema,
    annotations: annotations('Microsoft Ads Merchant Health'),
    _meta: meta('merchant','audit-cache-up-to-30s',['Microsoft Shopping Content','Microsoft Merchant Center','Microsoft Advertising Campaign Management'])
  },
  microsoft_ads_diagnose: {
    title: 'Diagnose Microsoft Ads Problem',
    description: 'Rank evidence-backed account, tracking, and Merchant health findings against a concrete natural-language Microsoft Ads problem and return the strongest likely root causes with remediation and verification evidence.',
    inputSchema: diagnoseInputSchema,
    outputSchema: microsoftAdsDiagnoseOutputSchema,
    annotations: annotations('Diagnose Microsoft Ads Problem'),
    _meta: meta('diagnostics','audit-cache-up-to-30s',['Microsoft Advertising','Microsoft Merchant Center','Microsoft UET','Utekos evidence'])
  },
  microsoft_ads_recommendations: {
    title: 'Microsoft Ads Recommendations',
    description: 'Read and filter current Microsoft Advertising Ad Insight recommendations. Recommendations are opportunity signals and must be evaluated against measured performance before action.',
    inputSchema: recommendationsInputSchema,
    outputSchema: microsoftAdsRecommendationsOutputSchema,
    annotations: annotations('Microsoft Ads Recommendations'),
    _meta: meta('optimization','audit-cache-up-to-30s',['Microsoft Advertising Ad Insight'])
  },
  microsoft_ads_report: {
    title: 'Microsoft Ads Reporting v13',
    description: 'Generate a live Microsoft Advertising Reporting v13 report with explicit type, columns, aggregation, date range, scope, and filter. Dynamic report columns remain typed at the row-cell boundary and signed download URLs are never returned.',
    inputSchema: reportInputSchema,
    outputSchema: microsoftAdsReportOutputSchema,
    annotations: annotations('Microsoft Ads Reporting v13'),
    _meta: meta('reporting','live-report',['Microsoft Advertising Reporting'])
  }
})


export function normalizeMicrosoftAdsFullAuditForWire(audit) {
  const value = audit && typeof audit === 'object' ? audit : {}
  return microsoftAdsFullAuditOutputSchema.parse({
    ok: Boolean(value.ok),
    auditVersion: Number.isInteger(value.auditVersion) && value.auditVersion > 0
      ? value.auditVersion
      : 1,
    startedAt: normalizeIso(value.startedAt),
    finishedAt: normalizeIso(value.finishedAt),
    account: normalizeSafeAccount(value.account),
    credentialReadiness: normalizeCredentialReadiness(value.credentialReadiness),
    criticalReads: normalizeCriticalReads(value.criticalReads),
    accountProperties: toJsonObject(value.accountProperties),
    uetTags: toJsonObject(value.uetTags),
    conversionGoals: toJsonObject(value.conversionGoals),
    campaigns: toJsonObject(value.campaigns),
    shoppingContent: toJsonObject(value.shoppingContent),
    report: toJsonObject(value.report),
    adInsight: toJsonObject(value.adInsight),
    localImplementation: toJsonObject(value.localImplementation),
    findings: Array.isArray(value.findings)
      ? value.findings.map(normalizeAuditFinding)
      : [],
    readFailures: Array.isArray(value.readFailures)
      ? value.readFailures.map(item => ({
          name: String(item?.name ?? 'unknown'),
          error: String(item?.error ?? 'Unknown read failure')
        }))
      : [],
    sources: Array.isArray(value.sources)
      ? value.sources.filter(source => typeof source === 'string' && /^https?:\/\//.test(source))
      : []
  })
}

export function summarizeMicrosoftAdsAudit(audit) {
  const value = audit && typeof audit === 'object' ? audit : {}
  const campaignItems = Array.isArray(value?.campaigns?.campaigns)
    ? value.campaigns.campaigns
    : []
  const recommendations = value?.adInsight?.recommendations ?? {}
  const account = value.account ? normalizeSafeAccount(value.account) : null

  return microsoftAdsSnapshotSummaryOutputSchema.parse({
    ok: Boolean(value.ok),
    auditVersion: Number.isInteger(value.auditVersion) && value.auditVersion > 0
      ? value.auditVersion
      : null,
    startedAt: normalizeOptionalIso(value.startedAt),
    finishedAt: normalizeOptionalIso(value.finishedAt),
    account,
    credentialReadiness: value.credentialReadiness
      ? normalizeCredentialReadiness(value.credentialReadiness)
      : null,
    criticalReads: value.criticalReads
      ? normalizeCriticalReads(value.criticalReads)
      : null,
    campaigns: {
      count: countValue(value?.campaigns?.count ?? campaignItems.length),
      activeCount: countValue(
        value?.campaigns?.activeCount ??
          campaignItems.filter(campaign => campaign?.status === 'Active').length
      ),
      byType: countBy(campaignItems, campaign => campaign?.type ?? 'Unknown')
    },
    uet: {
      count: countValue(value?.uetTags?.count),
      statuses: countBy(
        Array.isArray(value?.uetTags?.tags) ? value.uetTags.tags : [],
        tag => tag?.trackingStatus ?? 'Unknown'
      )
    },
    conversionGoals: {
      count: countValue(value?.conversionGoals?.count),
      trackingStatuses: countBy(
        Array.isArray(value?.conversionGoals?.goals) ? value.conversionGoals.goals : [],
        goal => goal?.trackingStatus ?? 'Unknown'
      )
    },
    merchant: value.shoppingContent
      ? {
          ok: Boolean(value.shoppingContent.ok),
          storeId: normalizeNullableId(value.shoppingContent.storeId),
          catalogCount: countValue(value?.shoppingContent?.catalogs?.count),
          productCount: countValue(value?.shoppingContent?.products?.count),
          disapprovedCount: countValue(value?.shoppingContent?.productStatuses?.disapprovedCount),
          warningCount: countValue(value?.shoppingContent?.productStatuses?.warningCount)
        }
      : null,
    reportTotals: value?.report?.totals
      ? toJsonObject(value.report.totals)
      : null,
    recommendations: {
      count: countValue(recommendations.count),
      byType: normalizeCountRecord(recommendations.byType)
    },
    readFailures: Array.isArray(value.readFailures)
      ? value.readFailures.map(item => ({
          name: String(item?.name ?? 'unknown'),
          error: String(item?.error ?? 'Unknown read failure')
        }))
      : [],
    auditFindingCount: Array.isArray(value.findings) ? value.findings.length : 0
  })
}

function normalizeSafeAccount(account) {
  const value = account && typeof account === 'object' ? account : {}
  const credentials = value.credentials && typeof value.credentials === 'object'
    ? value.credentials
    : {}
  return {
    environment: value.environment === 'sandbox' ? 'sandbox' : 'production',
    customerId: normalizeNullableString(value.customerId),
    accountId: normalizeNullableString(value.accountId),
    merchantStoreId: normalizeNullableString(value.merchantStoreId),
    uetTagId: normalizeNullableString(value.uetTagId),
    credentials: {
      developerTokenPresent: credentialPresence(value, credentials, 'developerToken'),
      clientIdPresent: credentialPresence(value, credentials, 'clientId'),
      clientSecretPresent: credentialPresence(value, credentials, 'clientSecret'),
      accessTokenPresent: credentialPresence(value, credentials, 'accessToken'),
      refreshTokenPresent: credentialPresence(value, credentials, 'refreshToken'),
      uetCapiTokenPresent: credentialPresence(value, credentials, 'uetCapiToken')
    }
  }
}

function credentialPresence(account, credentials, name) {
  const presentKey = `${name}Present`
  if (typeof credentials[presentKey] === 'boolean') return credentials[presentKey]
  if (typeof credentials[name] === 'boolean') return credentials[name]
  if (typeof account[presentKey] === 'boolean') return account[presentKey]
  return Boolean(account[name])
}

function normalizeCredentialReadiness(value) {
  const input = value && typeof value === 'object' ? value : {}
  return {
    developerTokenPresent: Boolean(input.developerTokenPresent),
    clientIdPresent: Boolean(input.clientIdPresent),
    clientSecretPresent: Boolean(input.clientSecretPresent),
    refreshTokenPresent: Boolean(input.refreshTokenPresent),
    accessTokenRefreshed: Boolean(input.accessTokenRefreshed),
    refreshTokenRotated: Boolean(input.refreshTokenRotated),
    rotatedRefreshTokenPersistenceRequired: Boolean(input.rotatedRefreshTokenPersistenceRequired),
    uetCapiTokenPresent: Boolean(input.uetCapiTokenPresent),
    uetCapiTokenAliasesChecked: Array.isArray(input.uetCapiTokenAliasesChecked)
      ? input.uetCapiTokenAliasesChecked.map(String)
      : [],
    cApiAuthKeyReadSkipped: Boolean(input.cApiAuthKeyReadSkipped),
    cApiAuthKeySkipReason: String(input.cApiAuthKeySkipReason ?? 'Not specified')
  }
}

function normalizeCriticalReads(value) {
  const input = value && typeof value === 'object' ? value : {}
  return {
    accountProperties: Boolean(input.accountProperties),
    uetTags: Boolean(input.uetTags),
    conversionGoals: Boolean(input.conversionGoals),
    campaigns: Boolean(input.campaigns),
    reporting: Boolean(input.reporting),
    shoppingContent: Boolean(input.shoppingContent),
    adInsight: Boolean(input.adInsight)
  }
}

function normalizeAuditFinding(value) {
  const input = value && typeof value === 'object' ? value : {}
  return {
    severity: ['critical','high','medium','low','info'].includes(input.severity)
      ? input.severity
      : 'info',
    code: String(input.code ?? 'UNKNOWN_FINDING'),
    area: String(input.area ?? 'unknown'),
    message: String(input.message ?? input.summary ?? 'Microsoft Ads audit finding'),
    ...(input.entity && typeof input.entity === 'object'
      ? {
          entity: {
            type: String(input.entity.type ?? 'unknown'),
            id: input.entity.id ?? null,
            name: input.entity.name == null ? null : String(input.entity.name)
          }
        }
      : {}),
    ...(input.evidence !== undefined
      ? { evidence: microsoftAdsJsonValueSchema.parse(input.evidence) }
      : {})
  }
}

function normalizeIso(value) {
  const normalized = normalizeOptionalIso(value)
  return normalized ?? new Date(0).toISOString()
}

function normalizeOptionalIso(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeNullableString(value) {
  if (value === undefined || value === null || value === '') return null
  return String(value)
}

function normalizeNullableId(value) {
  if (value === undefined || value === null || value === '') return null
  return typeof value === 'number' ? value : String(value)
}

function countValue(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0
}

function normalizeCountRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).map(([key, count]) => [String(key), countValue(count)])
  )
}

function countBy(items, keyFn) {
  const counts = {}
  for (const item of Array.isArray(items) ? items : []) {
    const key = String(keyFn(item) ?? 'Unknown')
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export function getMicrosoftAdsToolContract(name) {
  const contract = MICROSOFT_ADS_TOOL_CONTRACTS[name]
  if (!contract) throw new Error(`Unknown Microsoft Ads MCP tool contract: ${name}`)
  return contract
}

export function parseMicrosoftAdsToolOutput(name, value) {
  return getMicrosoftAdsToolContract(name).outputSchema.parse(value)
}

export function normalizeMicrosoftAdsRecommendation(item) {
  const type = item?.RecommendationType ?? item?.Type
  return recommendationOutputItemSchema.parse({ type, payload: toJsonObject(item) })
}

function toJsonObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { value: value ?? null }
  return microsoftAdsJsonObjectSchema.parse(dropUndefinedDeep(value))
}

function dropUndefinedDeep(value) {
  if (Array.isArray(value)) {
    return value.map(item => (item === undefined ? null : dropUndefinedDeep(item)))
  }

  if (value && typeof value === 'object') {
    const normalized = {}
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) continue
      normalized[key] = dropUndefinedDeep(entry)
    }
    return normalized
  }

  return value
}
