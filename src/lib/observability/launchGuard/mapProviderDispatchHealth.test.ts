import assert from 'node:assert/strict'
import test from 'node:test'
import type { ProviderDispatchHealthEvaluation } from '@/lib/analytics/server/providerDispatchHealth'
import { mapProviderDispatchHealth } from './mapProviderDispatchHealth'

const healthyEvaluation: ProviderDispatchHealthEvaluation = {
  ackSampleSize: 20,
  clickToEdgeBaselineDayCount: 7,
  clickToEdgeBaselineRate: 0.8,
  clickToEdgeCurrentClickIdCount: 80,
  clickToEdgeCurrentDate: '2026-08-29',
  clickToEdgeCurrentEdgeCount: 90,
  clickToEdgeCurrentOutboundClicks: 100,
  clickToEdgeCurrentSignalWithoutClickIdCount: 10,
  clickToEdgeCurrentSuccessfulEdgeCount: 90,
  clickToEdgeSuccessRate: 1,
  clickToEdgeRate: 0.9,
  deadLettered: [],
  edgeMetaClickIdCoverage: 1,
  edgeMetaLandingCount: 100,
  fbcGivenFbclidCoverage: 1,
  fbclidPageViewCount: 100,
  healthy: true,
  initialPendingOverTwoMinutes: [],
  invalidLedgerEvents: [],
  missingProviderAttempts: [],
  metaApiAcceptanceRate: 1,
  metaEligibleSampleSize: 20,
  p95AckLatencyMs: 1_000
}

test('maps provider evidence without treating accepted_unverified as final receipt', () => {
  const snapshots = mapProviderDispatchHealth({
    checkedAt: '2026-08-29T12:00:00.000Z',
    evaluation: healthyEvaluation,
    runId: '11111111-1111-4111-8111-111111111111'
  })
  const meta = snapshots.find(
    snapshot => snapshot.surface === 'direct_capi_acceptance'
  )

  assert.equal(meta?.status, 'healthy')
  assert.equal(meta?.providerReceiptStatus, 'accepted_unverified')
  assert.equal(
    meta?.measurements.provider_finality_verified,
    false
  )
})

test('maps dead letters and stuck initial attempts to separate critical incidents', () => {
  const problem = {
    attemptId: 'attempt',
    eventId: null,
    eventName: null,
    provider: 'meta'
  }
  const snapshots = mapProviderDispatchHealth({
    checkedAt: '2026-08-29T12:00:00.000Z',
    evaluation: {
      ...healthyEvaluation,
      deadLettered: [
        { ...problem, issueCode: 'dead_lettered' as const }
      ],
      initialPendingOverTwoMinutes: [
        {
          ...problem,
          issueCode: 'initial_pending_over_two_minutes' as const
        }
      ]
    },
    runId: '11111111-1111-4111-8111-111111111111'
  })

  assert.deepEqual(
    snapshots.slice(0, 2).map(snapshot => ({
      severity: snapshot.severity,
      status: snapshot.status,
      safeAction: snapshot.safeAction
    })),
    [
      {
        severity: 'critical',
        status: 'unhealthy',
        safeAction: undefined
      },
      {
        severity: 'critical',
        status: 'unhealthy',
        safeAction: 'retry_existing_outbox'
      }
    ]
  )
})
