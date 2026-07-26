import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleProviderDispatchHealthCron,
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
  deadLettered: [],
  healthy: true,
  initialPendingOverTwoMinutes: [],
  invalidLedgerEvents: [],
  missingProviderAttempts: [],
  p95AckLatencyMs: 1_500
}

test('rejects health cron requests without the configured secret', async () => {
  const dependencies: ProviderDispatchHealthCronDependencies = {
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
    dead_lettered: 0,
    healthy: true,
    initial_pending_over_two_minutes: 0,
    invalid_ledger_events: 0,
    missing_provider_attempts: 0,
    ok: true,
    p95_ack_latency_ms: 1_500
  })
})
