import type { ProviderDispatchHealthEvaluation } from '@/lib/analytics/server/providerDispatchHealth'
import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'

type Input = {
  checkedAt: string
  evaluation: ProviderDispatchHealthEvaluation
  runId: string
}

function binaryHealthSnapshot(input: Input & {
  errorCount: number
  failureCode: string
  fingerprint: string
  healthyCode: string
  severity: 'critical' | 'high' | 'medium'
  surface: string
}) {
  const failed = input.errorCount > 0

  return parseIntegrationHealthSnapshot({
    runId: input.runId,
    integration: 'canonical_provider_dispatch',
    surface: input.surface,
    status: failed ? 'unhealthy' : 'healthy',
    severity: failed ? input.severity : 'info',
    checkedAt: input.checkedAt,
    sampleCount: input.errorCount,
    errorCount: input.errorCount,
    evidenceLevel: 'internal_ledger',
    providerReceiptStatus: 'not_applicable',
    ...(failed ? { errorFingerprint: input.fingerprint } : {}),
    resultCode: failed ? input.failureCode : input.healthyCode,
    ...(failed && input.surface === 'initial_pending' ?
      { safeAction: 'retry_existing_outbox' as const }
    : {}),
    measurements: { issue_count: input.errorCount }
  })
}

export function mapProviderDispatchHealth(input: Input) {
  const contractErrorCount =
    input.evaluation.missingProviderAttempts.length +
    input.evaluation.invalidLedgerEvents.length
  const p95Failed =
    input.evaluation.p95AckLatencyMs !== null &&
    input.evaluation.p95AckLatencyMs > 60_000
  const metaReceiptFailed =
    input.evaluation.metaEligibleSampleSize >= 20 &&
    input.evaluation.metaApiAcceptanceRate !== null &&
    input.evaluation.metaApiAcceptanceRate < 0.99

  return [
    binaryHealthSnapshot({
      ...input,
      errorCount: input.evaluation.deadLettered.length,
      failureCode: 'provider_dead_letter_present',
      fingerprint: 'provider_dispatch:dead_lettered',
      healthyCode: 'provider_dead_letter_clear',
      severity: 'critical',
      surface: 'dead_lettered'
    }),
    binaryHealthSnapshot({
      ...input,
      errorCount:
        input.evaluation.initialPendingOverTwoMinutes.length,
      failureCode: 'provider_initial_pending_stuck',
      fingerprint: 'provider_dispatch:initial_pending_stuck',
      healthyCode: 'provider_initial_pending_clear',
      severity: 'critical',
      surface: 'initial_pending'
    }),
    binaryHealthSnapshot({
      ...input,
      errorCount: contractErrorCount,
      failureCode: 'canonical_dispatch_contract_invalid',
      fingerprint: 'provider_dispatch:contract_invalid',
      healthyCode: 'canonical_dispatch_contract_valid',
      severity: 'high',
      surface: 'canonical_contract'
    }),
    parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'canonical_provider_dispatch',
      surface: 'ack_latency',
      status: p95Failed ? 'degraded' : 'healthy',
      severity: p95Failed ? 'medium' : 'info',
      checkedAt: input.checkedAt,
      sampleCount: Math.max(
        input.evaluation.ackSampleSize,
        p95Failed ? 1 : 0
      ),
      errorCount: p95Failed ? 1 : 0,
      evidenceLevel: 'internal_ledger',
      providerReceiptStatus: 'accepted_unverified',
      ...(p95Failed ?
        { errorFingerprint: 'provider_dispatch:ack_latency' }
      : {}),
      resultCode:
        p95Failed ?
          'provider_ack_p95_over_60_seconds'
        : 'provider_ack_latency_within_threshold',
      measurements: {
        p95_ack_latency_ms: input.evaluation.p95AckLatencyMs,
        sample_size: input.evaluation.ackSampleSize
      }
    }),
    parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'meta',
      surface: 'direct_capi_acceptance',
      status: metaReceiptFailed ? 'degraded' : 'healthy',
      severity: metaReceiptFailed ? 'high' : 'info',
      checkedAt: input.checkedAt,
      sampleCount: input.evaluation.metaEligibleSampleSize,
      errorCount:
        metaReceiptFailed ?
          Math.max(
            1,
            Math.round(
              input.evaluation.metaEligibleSampleSize *
                (1 - (input.evaluation.metaApiAcceptanceRate ?? 0))
            )
          )
        : 0,
      evidenceLevel: 'provider_receipt',
      providerReceiptStatus:
        input.evaluation.metaEligibleSampleSize > 0 ?
          'accepted_unverified'
        : 'not_checked',
      ...(metaReceiptFailed ?
        { errorFingerprint: 'meta:direct_capi:acceptance_below_99' }
      : {}),
      resultCode:
        metaReceiptFailed ?
          'meta_accepted_unverified_below_99_percent'
        : 'meta_accepted_unverified_within_threshold',
      measurements: {
        acceptance_rate: input.evaluation.metaApiAcceptanceRate,
        eligible_sample_size: input.evaluation.metaEligibleSampleSize,
        provider_finality_verified: false
      }
    })
  ]
}
