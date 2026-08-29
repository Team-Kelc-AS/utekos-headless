import assert from 'node:assert/strict'
import test from 'node:test'
import { readCanonicalLedgerHealth } from './readCanonicalLedgerHealth'

const runId = '11111111-1111-4111-8111-111111111111'
const now = () => new Date('2026-08-29T12:00:00.000Z')

test('raises a critical ledger gap only with at least ten verified route pageviews', async () => {
  const snapshot = await readCanonicalLedgerHealth({
    executeQuery: async () => [
      {
        recent_event_count: 0,
        data_freshness_seconds: 901
      }
    ],
    now,
    routePageviews: 10,
    runId
  })

  assert.equal(snapshot.status, 'unhealthy')
  assert.equal(snapshot.severity, 'critical')
  assert.equal(
    snapshot.resultCode,
    'ledger_missing_with_verified_route_traffic'
  )
  assert.equal(
    snapshot.errorFingerprint,
    'supabase:ledger:skreddersy_varmen_missing_with_traffic'
  )
})

test('does not infer a ledger failure when the Vercel denominator is unavailable', async () => {
  const snapshot = await readCanonicalLedgerHealth({
    executeQuery: async () => [
      {
        recent_event_count: 0,
        data_freshness_seconds: null
      }
    ],
    now,
    routePageviews: null,
    runId
  })

  assert.equal(snapshot.status, 'unknown')
  assert.equal(snapshot.errorFingerprint, undefined)
})

test('returns only aggregate measurements for a fresh ledger', async () => {
  let parameters: readonly unknown[] = []
  const snapshot = await readCanonicalLedgerHealth({
    executeQuery: async (_query, receivedParameters) => {
      parameters = receivedParameters
      return [
        {
          recent_event_count: 7,
          data_freshness_seconds: 30
        }
      ]
    },
    now,
    routePageviews: 12,
    runId
  })

  assert.deepEqual(parameters, [
    'https://utekos.no/skreddersy-varmen%'
  ])
  assert.equal(snapshot.status, 'healthy')
  assert.deepEqual(snapshot.measurements, {
    ledger_event_count: 7,
    vercel_pageviews: 12
  })
})
