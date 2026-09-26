import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  GoogleDataManagerRequestStatusResult,
  GoogleDataManagerStatusClaim,
  GoogleDataManagerStatusOutcome
} from './googleDataManagerStatusTypes'
import {
  createPostgresGoogleDataManagerStatusStore,
  type GoogleDataManagerStatusQueryExecutor
} from './postgresGoogleDataManagerStatusStore'

type QueryCall = {
  parameters: readonly unknown[]
  query: string
}

const claim: GoogleDataManagerStatusClaim = {
  attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
  leaseToken: '86e9ab13-2900-4322-a6cf-c616881ed21b',
  requestId: 'google-request-1',
  statusCheckAttempts: 1
}

function result(
  overallStatus: GoogleDataManagerRequestStatusResult['overallStatus']
): GoogleDataManagerRequestStatusResult {
  return {
    destinationStatuses: [overallStatus],
    errorCounts: [],
    overallStatus,
    recordCount: 1,
    requestId: claim.requestId,
    response: {
      requestStatusPerDestination: [
        { requestStatus: overallStatus }
      ]
    },
    warningCounts: []
  }
}

function fakeExecutor(
  results: Array<Array<Record<string, unknown>>>
) {
  const calls: QueryCall[] = []
  const execute: GoogleDataManagerStatusQueryExecutor = async <
    T extends Record<string, unknown>
  >(
    query: string,
    parameters: readonly unknown[]
  ) => {
    calls.push({ parameters, query })
    return (results.shift() ?? []) as T[]
  }

  return { calls, execute }
}

test('claims only executed accepted Google requests with a lease', async () => {
  const fake = fakeExecutor([
    [
      {
        attempt_id: claim.attemptId,
        lease_token: claim.leaseToken,
        request_id: claim.requestId,
        status_check_attempts: 1
      }
    ]
  ])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  assert.deepEqual(await store.claimNext(), claim)
  assert.match(
    fake.calls[0]?.query ?? '',
    /validation_result ->> 'validate_only' = 'false'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /status = 'accepted_unverified'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /for update skip locked/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /statusCheckAttempts/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /interval '30 minutes'/i
  )
  assert.match(fake.calls[0]?.query ?? '', /nextStatusCheckAt/i)
  assert.match(fake.calls[0]?.query ?? '', /statusCheckLease/i)
  assert.match(
    fake.calls[0]?.query ?? '',
    /coalesce\(processed_at, created_at\)\s*> now\(\) - interval '24 hours'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /when coalesce\(\(response ->> 'statusCheckAttempts'\)::integer, 0\) = 0 then 0\s*else 1/i
  )
})

test('prioritizes first checks without weakening eligibility or lease guards', async () => {
  const fake = fakeExecutor([[]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  assert.equal(await store.claimNext(), null)
  const query = fake.calls[0]?.query ?? ''
  const candidate = query.split('lease as (')[0] ?? ''

  assert.match(candidate, /request_id is not null/i)
  assert.match(candidate, /request_id <> ''/i)
  assert.match(
    candidate,
    /provider_confirmed_success_with_warnings/i
  )
  assert.match(
    candidate,
    /not \(coalesce\(response, '\{\}'::jsonb\) \? 'statusCheckLease'\)/i
  )
  assert.match(
    candidate,
    /nextStatusCheckAt'\)::timestamptz <= now\(\)/i
  )
  assert.match(
    candidate,
    /order by[\s\S]*statusCheckAttempts[\s\S]*updated_at,\s*created_at,\s*id/i
  )
  assert.match(candidate, /for update skip locked\s*limit 1/i)
  assert.doesNotMatch(candidate, /\b(update|delete) ops\./i)
})

test('promotes provider-confirmed success to succeeded', async () => {
  const fake = fakeExecutor([[{ id: claim.attemptId }]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )
  const outcome: GoogleDataManagerStatusOutcome = {
    claim,
    latencyMs: 125,
    result: result('SUCCESS'),
    status: 'succeeded'
  }

  await store.complete(outcome)

  assert.match(fake.calls[0]?.query ?? '', /status = \$6/i)
  assert.match(
    fake.calls[0]?.query ?? '',
    /response_semantics = \$7/i
  )
  assert.deepEqual(fake.calls[0]?.parameters, [
    claim.attemptId,
    claim.requestId,
    claim.leaseToken,
    outcome.result.response,
    'SUCCESS',
    'succeeded',
    'provider_confirmed_success',
    125,
    null
  ])
})

test('keeps processing rows accepted and eligible for another poll', async () => {
  const fake = fakeExecutor([[{ id: claim.attemptId }]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  await store.complete({
    claim,
    latencyMs: 80,
    nextCheckAt: '2026-07-25T12:39:00.000Z',
    result: result('PROCESSING'),
    status: 'processing'
  })

  assert.deepEqual(fake.calls[0]?.parameters.slice(4, 7), [
    'PROCESSING',
    'accepted_unverified',
    'provider_processing'
  ])
  assert.match(
    fake.calls[0]?.query ?? '',
    /validation_result - 'provider_confirmed'/i
  )
  assert.equal(
    fake.calls[0]?.parameters.at(-1),
    '2026-07-25T12:39:00.000Z'
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /statusPollingExpiredAt/i
  )
})

test('dead-letters provider-confirmed failures with request metadata', async () => {
  const fake = fakeExecutor([[{ id: 'dead-letter-1' }]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  await store.complete({
    claim,
    latencyMs: 90,
    result: result('FAILED'),
    status: 'failed'
  })

  assert.match(
    fake.calls[0]?.query ?? '',
    /status = 'dead_lettered'/i
  )
  assert.match(fake.calls[0]?.query ?? '', /request_status/i)
  assert.equal(
    fake.calls[0]?.parameters.at(-1),
    'google_data_manager_request_failed'
  )
})

test('retains transient status lookup failures for retry', async () => {
  const fake = fakeExecutor([[{ id: claim.attemptId }]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  await store.complete({
    claim,
    errorMessage: 'temporary',
    latencyMs: 100,
    nextCheckAt: '2026-07-25T12:39:00.000Z',
    status: 'retry'
  })

  assert.match(
    fake.calls[0]?.query ?? '',
    /provider_status_check_retry/i
  )
  assert.doesNotMatch(
    fake.calls[0]?.query ?? '',
    /status = 'dead_lettered'/i
  )
  assert.match(fake.calls[0]?.query ?? '', /nextStatusCheckAt/i)
})

test('records warning-bearing success without marking it green', async () => {
  const fake = fakeExecutor([[{ id: claim.attemptId }]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  await store.complete({
    claim,
    latencyMs: 125,
    result: {
      ...result('SUCCESS'),
      warningCounts: [
        {
          reason: 'PROCESSING_WARNING_REASON_INTERNAL_ERROR',
          recordCount: 1
        }
      ]
    },
    status: 'succeeded_with_warnings'
  })

  assert.ok(
    fake.calls[0]?.parameters.includes(
      'provider_confirmed_success_with_warnings'
    )
  )
  assert.ok(
    fake.calls[0]?.parameters.includes('accepted_unverified')
  )
})

test('dead-letters provider processing mismatches without replay', async () => {
  const fake = fakeExecutor([[{ id: 'dead-letter-1' }]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  await store.complete({
    claim,
    latencyMs: 125,
    result: { ...result('SUCCESS'), recordCount: 2 },
    status: 'processing_failure'
  })

  assert.equal(
    fake.calls[0]?.parameters.at(-1),
    'google_data_manager_request_processing_mismatch'
  )
})

test('keeps historical status debt visible without rewriting provider evidence', async () => {
  const fake = fakeExecutor([[{ overdue_count: '2' }]])
  const store = createPostgresGoogleDataManagerStatusStore(
    fake.execute
  )

  assert.equal(await store.countOverdue(), 2)
  assert.match(
    fake.calls[0]?.query ?? '',
    /coalesce\(processed_at, created_at\)\s*<= now\(\) - interval '24 hours'/i
  )
  assert.doesNotMatch(
    fake.calls[0]?.query ?? '',
    /update ops\.provider_dispatch_attempts/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /provider_confirmed_success_with_warnings/i
  )
})
