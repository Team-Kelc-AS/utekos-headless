import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPostgresProviderDispatchHealthStore,
  type ProviderDispatchHealthQueryExecutor
} from './postgresProviderDispatchHealthStore'

test('reads the bounded ledger, problem, and ACK-latency windows', async () => {
  const queries: string[] = []
  const results: Array<Array<Record<string, unknown>>> = [
    [
      {
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        event_name: 'view_category',
        payload: { event_name: 'view_category' },
        providers: ['google', 'meta']
      }
    ],
    [
      {
        attempt_id: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        event_name: 'view_category',
        issue_code: 'initial_pending_over_two_minutes',
        provider: 'meta'
      }
    ],
    [{ sample_size: 20, p95_ack_latency_ms: '42000.5' }]
  ]
  const execute: ProviderDispatchHealthQueryExecutor = async <
    T extends Record<string, unknown>
  >(query: string) => {
    queries.push(query)
    return (results.shift() ?? []) as T[]
  }
  const store = createPostgresProviderDispatchHealthStore(execute)

  const snapshot = await store.readSnapshot()

  assert.equal(snapshot.ledgerCandidates.length, 1)
  assert.deepEqual(snapshot.ledgerCandidates[0]?.providers, [
    'google',
    'meta'
  ])
  assert.equal(snapshot.problemAttempts.length, 1)
  assert.equal(snapshot.ackSampleSize, 20)
  assert.equal(snapshot.p95AckLatencyMs, 42_000.5)
  assert.match(queries[0] ?? '', /interval '2 minutes'/i)
  assert.match(queries[1] ?? '', /status = 'pending'/i)
  assert.match(queries[1] ?? '', /interval '1 hour'/i)
  assert.match(queries[1] ?? '', /status = 'dead_lettered'/i)
  assert.match(queries[2] ?? '', /percentile_cont\(0\.95\)/i)
  assert.match(
    queries[2] ?? '',
    /status = 'accepted_unverified'/i
  )
  assert.doesNotMatch(queries[2] ?? '', /'succeeded'/i)
})
