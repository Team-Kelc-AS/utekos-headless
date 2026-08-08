import { z } from 'zod'

export const MICROSOFT_ADS_HEALTH_SEVERITIES = Object.freeze(['critical','high','medium','low','info'])
export const MICROSOFT_ADS_HEALTH_STATUSES = Object.freeze(['critical','degraded','attention','healthy','unknown'])
export const MICROSOFT_ADS_DIAGNOSIS_CERTAINTIES = Object.freeze(['confirmed','probable','possible','unknown'])
export const MICROSOFT_ADS_REMEDIATION_BACKENDS = Object.freeze(['campaign-management','reporting','ad-insight','shopping-content','uet-capi','browser','local-code','account-settings','unknown'])

const severitySchema = z.enum(MICROSOFT_ADS_HEALTH_SEVERITIES)
const certaintySchema = z.enum(MICROSOFT_ADS_DIAGNOSIS_CERTAINTIES)
const backendSchema = z.enum(MICROSOFT_ADS_REMEDIATION_BACKENDS)

export const microsoftAdsJsonValueSchema = z.lazy(() =>
  z.union([
    z.string(), z.number(), z.boolean(), z.null(),
    z.array(microsoftAdsJsonValueSchema),
    z.record(z.string(), microsoftAdsJsonValueSchema)
  ])
)
export const microsoftAdsJsonObjectSchema = z.record(z.string(), microsoftAdsJsonValueSchema)

export const microsoftAdsHealthEntitySchema = z.object({
  type: z.string().trim().min(1),
  id: z.union([z.string(), z.number()]).optional().nullable(),
  name: z.string().optional().nullable()
}).strict()

export const microsoftAdsHealthEvidenceSchema = z.object({
  source: z.string().trim().min(1),
  key: z.string().trim().min(1),
  value: microsoftAdsJsonValueSchema,
  note: z.string().optional().nullable()
}).strict()

export const microsoftAdsHealthDiagnosisSchema = z.object({
  certainty: certaintySchema,
  confidence: z.number().min(0).max(1),
  rootCause: z.string().optional().nullable(),
  rationale: z.string().optional().nullable()
}).strict()

export const microsoftAdsHealthRemediationSchema = z.object({
  summary: z.string().trim().min(1),
  backend: backendSchema,
  operation: z.string().optional().nullable(),
  parameters: microsoftAdsJsonValueSchema.optional(),
  steps: z.array(z.string().trim().min(1)).min(1)
}).strict()

export const microsoftAdsHealthFindingSchema = z.object({
  id: z.string().trim().min(1),
  severity: severitySchema,
  code: z.string().trim().regex(/^[A-Z0-9_]+$/),
  area: z.string().trim().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  entity: microsoftAdsHealthEntitySchema.optional().nullable(),
  diagnosis: microsoftAdsHealthDiagnosisSchema,
  evidence: z.array(microsoftAdsHealthEvidenceSchema),
  remediation: microsoftAdsHealthRemediationSchema,
  verification: z.array(z.string().trim().min(1)).min(1),
  sourceDocs: z.array(z.string().url())
}).strict()

export const microsoftAdsHealthCoverageSchema = z.object({
  complete: z.boolean(),
  checks: z.array(z.object({
    name: z.string().trim().min(1),
    ok: z.boolean(),
    reason: z.string().optional().nullable()
  }).strict())
}).strict()

export const microsoftAdsHealthSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  actionable: z.number().int().nonnegative()
}).strict()

export const microsoftAdsHealthResultSchema = z.object({
  scope: z.string().trim().min(1),
  status: z.enum(MICROSOFT_ADS_HEALTH_STATUSES),
  ok: z.boolean(),
  summary: microsoftAdsHealthSummarySchema,
  coverage: microsoftAdsHealthCoverageSchema,
  metrics: microsoftAdsJsonObjectSchema,
  findings: z.array(microsoftAdsHealthFindingSchema)
}).strict()

export function createMicrosoftAdsHealthFinding(input) {
  return microsoftAdsHealthFindingSchema.parse({ ...input, id: input.id ?? createFindingId(input) })
}
export function createMicrosoftAdsHealthResult({ scope, findings, coverage, metrics = {} }) {
  const parsedCoverage = microsoftAdsHealthCoverageSchema.parse(coverage)
  const parsedFindings = findings.map(createMicrosoftAdsHealthFinding).sort(compareMicrosoftAdsHealthFindings)
  const summary = summarizeMicrosoftAdsHealthFindings(parsedFindings)
  const status = resolveMicrosoftAdsHealthStatus(parsedFindings, { coverageComplete: parsedCoverage.complete })
  return microsoftAdsHealthResultSchema.parse({
    scope,
    status,
    ok: status === 'healthy' || status === 'attention',
    summary,
    coverage: parsedCoverage,
    metrics,
    findings: parsedFindings
  })
}
export function summarizeMicrosoftAdsHealthFindings(findings) {
  const counts = Object.fromEntries(MICROSOFT_ADS_HEALTH_SEVERITIES.map(s => [s, 0]))
  for (const finding of findings) if (finding?.severity in counts) counts[finding.severity] += 1
  return { total: findings.length, ...counts, actionable: counts.critical + counts.high + counts.medium + counts.low }
}
export function resolveMicrosoftAdsHealthStatus(findings, { coverageComplete = true } = {}) {
  if (findings.some(f => f.severity === 'critical')) return 'critical'
  if (findings.some(f => f.severity === 'high')) return 'degraded'
  if (!coverageComplete) return 'unknown'
  if (findings.some(f => f.severity === 'medium' || f.severity === 'low')) return 'attention'
  return 'healthy'
}
export function compareMicrosoftAdsHealthFindings(left, right) {
  const weights = { critical:5, high:4, medium:3, low:2, info:1 }
  const d = (weights[right?.severity] ?? 0) - (weights[left?.severity] ?? 0)
  return d || String(left?.code ?? '').localeCompare(String(right?.code ?? ''))
}
function createFindingId(input) {
  return [input.area,input.code,input.entity?.type,input.entity?.id]
    .filter(v => v !== undefined && v !== null && String(v))
    .map(v => slug(String(v))).join(':')
}
function slug(value) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') }
