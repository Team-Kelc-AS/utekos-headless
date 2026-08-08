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

export const MICROSOFT_ADS_TOOL_CONTRACT_VERSION = '1.0.0'
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
  customerId: z.string().optional(),
  accountId: z.string().optional(),
  merchantStoreId: z.string().optional(),
  uetTagId: z.string().optional(),
  developerTokenPresent: z.boolean().optional(),
  clientIdPresent: z.boolean().optional(),
  clientSecretPresent: z.boolean().optional(),
  refreshTokenPresent: z.boolean().optional(),
  accessTokenPresent: z.boolean().optional(),
  uetCapiTokenPresent: z.boolean().optional()
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
  localCapiRequiresMsclkid: z.boolean()
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
  diagnosticMatch: microsoftAdsJsonValueSchema
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

const reportStatusSchema = z.object({ Status: z.string().nullable() }).strict()
const reportResultSchema = z.object({
  ok: z.boolean(),
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
    _meta: meta('tracking','audit-cache-up-to-30s',['Microsoft UET','Microsoft Advertising Campaign Management','Microsoft Advertising Reporting','Utekos tracking implementation'])
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
  return microsoftAdsJsonObjectSchema.parse(value)
}
