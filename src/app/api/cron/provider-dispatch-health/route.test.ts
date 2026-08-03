import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleProviderDispatchHealthCron,
  maxDuration,
  type ProviderDispatchHealthCronDependencies
} from './route'

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/provider-dispatch-health',
    authorization ? { headers: { authorization } } : undefined
  )
}

const healthyResult = {
  ackSampleSize: 3,
  clickToEdgeBaselineDayCount: 7,
  clickToEdgeBaselineRate: 0.7,
  clickToEdgeCurrentClickIdCount: 65,
  clickToEdgeCurrentDate: '2026-07-31',
  clickToEdgeCurrentEdgeCount: 70,
  clickToEdgeCurrentOutboundClicks: 100,
  clickToEdgeCurrentSignalWithoutClickIdCount: 5,
  clickToEdgeCurrentSuccessfulEdgeCount: 68,
  clickToEdgeRate: 0.7,
  clickToEdgeSuccessRate: 68 / 70,
  deadLettered: [],
  edgeMetaClickIdCoverage: 0.99,
  edgeMetaLandingCount: 100,
  fbcGivenFbclidCoverage: 1,
  fbclidPageViewCount: 99,
  healthy: true,
  initialPendingOverTwoMinutes: [],
  invalidLedgerEvents: [],
  missingProviderAttempts: [],
  metaApiAcceptanceRate: 1,
  metaEligibleSampleSize: 100,
  p95AckLatencyMs: 1_500
}

test('allows the measured production health queries to finish', () => {
  assert.equal(maxDuration, 300)
})

test('rejects health cron requests without the configured secret', async () => {
  const dependencies: ProviderDispatchHealthCronDependencies = {
    flush: async () => {
      throw new Error('must not flush')
    },
    getCronSecret: () => 'correct-secret',
    runHealthCheck: async () => {
      throw new Error('must not run')
    }
  }

  const response = await handleProviderDispatchHealthCron(
    request('Bearer wrong-secret'),
    dependencies
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('returns only aggregate, PII-free health results', async () => {
  const dependencies: ProviderDispatchHealthCronDependencies = {
    flush: async () => {
      throw new Error('must not flush healthy result')
    },
    getCronSecret: () => 'correct-secret',
    runHealthCheck: async () => healthyResult
  }

  const response = await handleProviderDispatchHealthCron(
    request('Bearer correct-secret'),
    dependencies
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ack_sample_size: 3,
    alert_delivery_flushed: null,
    click_to_edge_baseline_day_count: 7,
    click_to_edge_baseline_rate: 0.7,
    click_to_edge_current_click_id_count: 65,
    click_to_edge_current_date: '2026-07-31',
    click_to_edge_current_edge_count: 70,
    click_to_edge_current_outbound_clicks: 100,
    click_to_edge_current_signal_without_click_id_count: 5,
    click_to_edge_current_successful_edge_count: 68,
    click_to_edge_rate: 0.7,
    click_to_edge_success_rate: 68 / 70,
    dead_lettered: 0,
    edge_meta_click_id_coverage: 0.99,
    edge_meta_landing_count: 100,
    fbc_given_fbclid_coverage: 1,
    fbclid_page_view_count: 99,
    healthy: true,
    initial_pending_over_two_minutes: 0,
    invalid_ledger_events: 0,
    missing_provider_attempts: 0,
    meta_api_acceptance_rate: 1,
    meta_eligible_sample_size: 100,
    ok: true,
    p95_ack_latency_ms: 1_500
  })
})

test('flushes captured alerts before returning an unhealthy result', async () => {
  const flushTimeouts: number[] = []
  const dependencies: ProviderDispatchHealthCronDependencies = {
    flush: async timeout => {
      flushTimeouts.push(timeout ?? 0)
      return true
    },
    getCronSecret: () => 'correct-secret',
    runHealthCheck: async () => ({
      ...healthyResult,
      edgeMetaClickIdCoverage: 0.93,
      healthy: false
    })
  }

  const response = await handleProviderDispatchHealthCron(
    request('Bearer correct-secret'),
    dependencies
  )

  assert.equal(response.status, 200)
  assert.deepEqual(flushTimeouts, [1_500])
  assert.equal(
    (await response.json()).alert_delivery_flushed,
    true
  )
})

test('fails visibly when an unhealthy alert cannot be flushed', async () => {
  const dependencies: ProviderDispatchHealthCronDependencies = {
    flush: async () => false,
    getCronSecret: () => 'correct-secret',
    runHealthCheck: async () => ({
      ...healthyResult,
      edgeMetaClickIdCoverage: 0.93,
      healthy: false
    })
  }

  await assert.rejects(
    handleProviderDispatchHealthCron(
      request('Bearer correct-secret'),
      dependencies
    ),
    /alert flush timed out/i
  )
})
