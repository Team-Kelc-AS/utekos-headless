import assert from 'node:assert/strict'
import test from 'node:test'
import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'
import { createPostgresIntegrationHealthStore } from './postgresIntegrationHealthStore'

const runId = '11111111-1111-4111-8111-111111111111'

test('persists privacy-free snapshots and returns incident counters', async () => {
  const calls: Array<{ query: string; parameters: readonly unknown[] }> = []
  const store = createPostgresIntegrationHealthStore(
    async (query, parameters) => {
      calls.push({ query, parameters })
      if (query.includes('launch_guard:recover_incidents')) return []
      if (query.includes('launch_guard:read_current_incidents')) {
        return [
          {
            id: '22222222-2222-4222-8222-222222222222',
            fingerprint: 'probe:api_log_contract:abc',
            integration: 'vercel',
            surface: 'api_log_contract',
            severity: 'critical',
            summary_code: 'valid_probe_rejected',
            observation_count: 2,
            recent_failure_count: 2,
            current_opened_at: '2026-08-29 12:00:00+00',
            last_alerted_at: null
          }
        ]
      }
      return []
    }
  )
  const snapshot = parseIntegrationHealthSnapshot({
    runId,
    integration: 'vercel',
    surface: 'api_log_contract',
    status: 'unhealthy',
    severity: 'critical',
    checkedAt: '2026-08-29T12:00:00.000Z',
    sampleCount: 1,
    errorCount: 1,
    evidenceLevel: 'synthetic_probe',
    providerReceiptStatus: 'not_applicable',
    errorFingerprint: 'probe:api_log_contract:abc',
    resultCode: 'valid_probe_rejected',
    measurements: { status_code: 500 }
  })

  const result = await store.persistAndReconcile(
    [snapshot],
    new Date('2026-08-29T12:00:00.000Z')
  )

  assert.equal(result.incidents[0]?.recentFailureCount, 2)
  assert.equal(calls.length, 4)
  const serialized = String(calls[0]?.parameters[0])
  assert.equal(Array.isArray(JSON.parse(serialized)), true)
  assert.match(
    calls[0]?.query ?? '',
    /\$1::jsonb #>> '\{\}'::text\[\]/u
  )
  assert.match(serialized, /"result_code":"valid_probe_rejected"/)
  assert.doesNotMatch(serialized, /authorization|cron-secret|page_url/i)
})

test('reserves one deduplicated delivery and recognizes the controlled SMS receipt', async () => {
  const parameters: Array<readonly unknown[]> = []
  const store = createPostgresIntegrationHealthStore(
    async (query, received) => {
      parameters.push(received)
      if (query.includes('launch_guard:reserve_delivery')) {
        return [{ id: '33333333-3333-4333-8333-333333333333' }]
      }
      if (query.includes('launch_guard:read_twilio_test_receipt')) {
        return [{ delivered: true }]
      }
      if (query.includes('launch_guard:ensure_twilio_test_incident')) {
        return [
          {
            id: '44444444-4444-4444-8444-444444444444',
            current_opened_at: '2026-08-29 12:00:00+00'
          }
        ]
      }
      return []
    }
  )

  const deliveryId = await store.reserveDelivery({
    channel: 'twilio_sms',
    currentOpenedAt: '2026-08-29T12:00:00.000Z',
    fingerprint: 'probe:api_log_contract:abc',
    incidentId: '22222222-2222-4222-8222-222222222222',
    kind: 'incident',
    now: new Date('2026-08-29T12:05:00.000Z')
  })

  assert.equal(deliveryId, '33333333-3333-4333-8333-333333333333')
  assert.equal(await store.hasDeliveredTwilioTest(), true)
  assert.equal(
    (
      await store.ensureTwilioTestIncident(
        new Date('2026-08-29T12:00:00.000Z')
      )
    ).id,
    '44444444-4444-4444-8444-444444444444'
  )
  assert.equal(typeof parameters[0]?.[2], 'string')
  assert.equal(String(parameters[0]?.[2]).length, 64)
})
