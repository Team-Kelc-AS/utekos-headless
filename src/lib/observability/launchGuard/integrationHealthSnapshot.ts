import { z } from 'zod'

export const integrationHealthStatusSchema = z.enum([
  'healthy',
  'degraded',
  'unhealthy',
  'unknown',
  'not_configured'
])

export const integrationHealthSeveritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'info'
])

export const integrationHealthEvidenceLevelSchema = z.enum([
  'configuration',
  'synthetic_probe',
  'internal_ledger',
  'platform_observation',
  'provider_receipt'
])

export const providerReceiptStatusSchema = z.enum([
  'not_applicable',
  'not_checked',
  'accepted_unverified',
  'verified',
  'rejected'
])

export const integrationHealthSnapshotSchema = z.strictObject({
  runId: z.string().uuid(),
  integration: z.string().min(1).max(80),
  surface: z.string().regex(/^[a-z0-9_:-]+$/u).max(120),
  status: integrationHealthStatusSchema,
  severity: integrationHealthSeveritySchema,
  checkedAt: z.string().datetime({ offset: true }),
  dataFreshnessSeconds: z.number().int().nonnegative().optional(),
  trafficWindowSeconds: z.number().int().positive().optional(),
  sampleCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  evidenceLevel: integrationHealthEvidenceLevelSchema,
  providerReceiptStatus: providerReceiptStatusSchema,
  errorFingerprint: z
    .string()
    .regex(/^[a-z0-9:_-]+$/u)
    .max(160)
    .optional(),
  resultCode: z
    .string()
    .regex(/^[a-z0-9:_-]+$/u)
    .max(160),
  safeAction: z
    .enum(['retry_probe_once', 'retry_existing_outbox'])
    .optional(),
  measurements: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  )
})
.superRefine((snapshot, context) => {
  if (snapshot.errorCount > snapshot.sampleCount) {
    context.addIssue({
      code: 'custom',
      message: 'errorCount cannot exceed sampleCount',
      path: ['errorCount']
    })
  }

  if (
    snapshot.errorFingerprint &&
    snapshot.status !== 'unhealthy' &&
    snapshot.status !== 'degraded'
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Only failed snapshots may have an error fingerprint',
      path: ['errorFingerprint']
    })
  }
})

export type IntegrationHealthSnapshot = z.infer<
  typeof integrationHealthSnapshotSchema
>

export type IntegrationHealthFailure = Readonly<{
  fingerprint: string
  integration: string
  severity: Exclude<
    IntegrationHealthSnapshot['severity'],
    'info'
  >
  summaryCode: string
  surface: string
}>

export function parseIntegrationHealthSnapshot(
  value: unknown
): IntegrationHealthSnapshot {
  return integrationHealthSnapshotSchema.parse(value)
}
