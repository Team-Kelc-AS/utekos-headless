import { z } from 'zod'

export const MICROSOFT_ADS_HEALTH_SEVERITIES = Object.freeze([
  'critical',
  'high',
  'medium',
  'low',
  'info'
])

export const MICROSOFT_ADS_HEALTH_STATUSES = Object.freeze([
  'critical',
  'degraded',
  'attention',
  'healthy',
  'unknown'
])

export const MICROSOFT_ADS_DIAGNOSIS_CERTAINTIES = Object.freeze([
  'confirmed',
  'probable',
  'possible',
  'unknown'
])

export const MICROSOFT_ADS_REMEDIATION_BACKENDS = Object.freeze([
  'campaign-management',
  'reporting',
  'ad-insight',
  'shopping-content',
  'uet-capi',
  'browser',
  'local-code',
  'account-settings',
  'unknown'
])

const severitySchema = z.enum(MICROSOFT_ADS_HEALTH_SEVERITIES)
const certaintySchema = z.enum(MICROSOFT_ADS_DIAGNOSIS_CERTAINTIES)
const backendSchema = z.enum(MICROSOFT_ADS_REMEDIATION_BACKENDS)

export const microsoftAdsHealthEntitySchema = z
  .object({
    type: z.string().trim().min(1),
    id: z.union([z.string(), z.number()]).optional().nullable(),
    name: z.string().optional().nullable()
  })
  .passthrough()

export const microsoftAdsHealthEvidenceSchema = z
  .object({
    source: z.string().trim().min(1),
    key: z.string().trim().min(1),
    value: z.unknown(),
    note: z.string().optional().nullable()
  })
  .passthrough()

export const microsoftAdsHealthDiagnosisSchema = z
  .object({
    certainty: certaintySchema,
    confidence: z.number().min(0).max(1),
    rootCause: z.string().optional().nullable(),
    rationale: z.string().optional().nullable()
  })
  .passthrough()

export const microsoftAdsHealthRemediationSchema = z
  .object({
    summary: z.string().trim().min(1),
    backend: backendSchema,
    operation: z.string().optional().nullable(),
    parameters: z.unknown().optional(),
    steps: z.array(z.string().trim().min(1)).min(1)
  })
  .passthrough()

export const microsoftAdsHealthFindingSchema = z
  .object({
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
    sourceDocs: z.array(z.string().trim().min(1))
  })
  .passthrough()

export const microsoftAdsHealthCoverageSchema = z
  .object({
    complete: z.boolean(),
    checks: z.array(
      z
        .object({
          name: z.string().trim().min(1),
          ok: z.boolean(),
          reason: z.string().optional().nullable()
        })
        .passthrough()
    )
  })
  .passthrough()

export function createMicrosoftAdsHealthFinding(input) {
  const normalized = {
    ...input,
    id: input.id ?? createFindingId(input)
  }

  return microsoftAdsHealthFindingSchema.parse(normalized)
}

export function createMicrosoftAdsHealthResult({
  scope,
  findings,
  coverage,
  metrics = {}
}) {
  const parsedCoverage = microsoftAdsHealthCoverageSchema.parse(coverage)
  const parsedFindings = findings
    .map(createMicrosoftAdsHealthFinding)
    .sort(compareMicrosoftAdsHealthFindings)

  const summary = summarizeMicrosoftAdsHealthFindings(parsedFindings)
  const status = resolveMicrosoftAdsHealthStatus(parsedFindings, {
    coverageComplete: parsedCoverage.complete
  })

  return {
    scope,
    status,
    ok: status === 'healthy' || status === 'attention',
    summary,
    coverage: parsedCoverage,
    metrics,
    findings: parsedFindings
  }
}

export function summarizeMicrosoftAdsHealthFindings(findings) {
  const counts = Object.fromEntries(
    MICROSOFT_ADS_HEALTH_SEVERITIES.map(severity => [severity, 0])
  )

  for (const finding of findings) {
    if (finding?.severity in counts) {
      counts[finding.severity] += 1
    }
  }

  return {
    total: findings.length,
    ...counts,
    actionable: counts.critical + counts.high + counts.medium + counts.low
  }
}

export function resolveMicrosoftAdsHealthStatus(
  findings,
  { coverageComplete = true } = {}
) {
  if (findings.some(finding => finding.severity === 'critical')) {
    return 'critical'
  }

  if (findings.some(finding => finding.severity === 'high')) {
    return 'degraded'
  }

  if (!coverageComplete) {
    return 'unknown'
  }

  if (
    findings.some(
      finding => finding.severity === 'medium' || finding.severity === 'low'
    )
  ) {
    return 'attention'
  }

  return 'healthy'
}

export function compareMicrosoftAdsHealthFindings(left, right) {
  const weights = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1
  }

  const severityDelta =
    (weights[right?.severity] ?? 0) - (weights[left?.severity] ?? 0)

  if (severityDelta !== 0) {
    return severityDelta
  }

  return String(left?.code ?? '').localeCompare(String(right?.code ?? ''))
}

function createFindingId(input) {
  const parts = [
    input.area,
    input.code,
    input.entity?.type,
    input.entity?.id
  ]
    .filter(value => value !== undefined && value !== null && String(value))
    .map(value => slug(String(value)))

  return parts.join(':')
}

function slug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
