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
    [{ sample_size: 20, p95_ack_latency_ms: '42000.5' }],
    [
      {
        accepted_unverified_count: 99,
        eligible_sample_size: 100
      }
    ],
    [
      {
        fbc_and_fbclid_page_view_count: 75,
        fbclid_page_view_count: 75
      }
    ],
    [
      {
        meta_landing_count: 100,
        meta_landing_with_fbclid_count: 99
      }
    ],
    [
      {
        baseline_day_count: 7,
        baseline_rate: '0.75',
        current_click_id_edge_count: 275,
        current_date: '2026-07-31',
        current_edge_count: 300,
        current_outbound_clicks: 500,
        current_signal_without_click_id_edge_count: 25,
        current_successful_edge_count: 290
      }
    ]
  ]
  const execute: ProviderDispatchHealthQueryExecutor = async <
    T extends Record<string, unknown>
  >(
    query: string
  ) => {
    queries.push(query)
    return (results.shift() ?? []) as T[]
  }
  const store =
    createPostgresProviderDispatchHealthStore(execute)

  const snapshot = await store.readSnapshot()

  assert.equal(snapshot.ledgerCandidates.length, 1)
  assert.deepEqual(snapshot.ledgerCandidates[0]?.providers, [
    'google',
    'meta'
  ])
  assert.equal(snapshot.problemAttempts.length, 1)
  assert.equal(snapshot.ackSampleSize, 20)
  assert.equal(snapshot.p95AckLatencyMs, 42_000.5)
  assert.equal(snapshot.metaAcceptedUnverifiedCount, 99)
  assert.equal(snapshot.metaEligibleSampleSize, 100)
  assert.equal(snapshot.fbcAndFbclidPageViewCount, 75)
  assert.equal(snapshot.fbclidPageViewCount, 75)
  assert.equal(snapshot.edgeMetaLandingCount, 100)
  assert.equal(snapshot.edgeMetaLandingWithFbclidCount, 99)
  assert.equal(snapshot.clickToEdgeBaselineDayCount, 7)
  assert.equal(snapshot.clickToEdgeBaselineRate, 0.75)
  assert.equal(snapshot.clickToEdgeCurrentClickIdCount, 275)
  assert.equal(snapshot.clickToEdgeCurrentDate, '2026-07-31')
  assert.equal(snapshot.clickToEdgeCurrentEdgeCount, 300)
  assert.equal(snapshot.clickToEdgeCurrentOutboundClicks, 500)
  assert.equal(
    snapshot.clickToEdgeCurrentSignalWithoutClickIdCount,
    25
  )
  assert.equal(
    snapshot.clickToEdgeCurrentSuccessfulEdgeCount,
    290
  )
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
  assert.match(queries[3] ?? '', /provider = 'meta'/i)
  assert.match(
    queries[3] ?? '',
    /status = 'accepted_unverified'/i
  )
  assert.match(
    queries[3] ?? '',
    /ledger\.payload ->> 'environment' = 'production'/i
  )
  assert.match(queries[4] ?? '', /event_name = 'page_view'/i)
  assert.match(
    queries[4] ?? '',
    /payload #>> '\{click_id,fbclid\}'/i
  )
  assert.match(
    queries[4] ?? '',
    /payload ->> 'environment' = 'production'/i
  )
  assert.match(
    queries[5] ?? '',
    /ops\.meta_landing_observability/i
  )
  assert.match(
    queries[5] ?? '',
    /is_primary_request_observation/i
  )
  assert.match(queries[5] ?? '', /traffic_classification/i)
  assert.match(
    queries[6] ?? '',
    /marketing\.meta_ad_delivery_insights/i
  )
  assert.match(queries[6] ?? '', /baseline_rate/i)
  assert.match(
    queries[6] ?? '',
    /ops\.meta_landing_observability/i
  )
  assert.match(queries[6] ?? '', /is_first_fbclid_observation/i)
  assert.match(
    queries[6] ?? '',
    /is_primary_request_observation[\s\S]*not observation\.fbclid_present/i
  )
  assert.doesNotMatch(
    queries[6] ?? '',
    /and observation\.status_code between 200 and 399/i
  )
  assert.match(queries[6] ?? '', /traffic_classification/i)
})
