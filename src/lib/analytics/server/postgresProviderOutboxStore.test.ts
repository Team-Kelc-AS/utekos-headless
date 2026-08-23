import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from '../pageViewEvent'
import type { ProviderAdapter } from './providerAdapter'
import type { ProviderAttemptOutcome } from './providerOutboxTypes'
import {
  createPostgresProviderOutboxDatabase,
  type ProviderOutboxQueryExecutor
} from './postgresProviderOutboxStore'

type Receipt = {
  accepted: number
  providerRequestId: string
}

type QueryCall = {
  parameters: readonly unknown[]
  query: string
}

const adapter: ProviderAdapter<CanonicalPageView, Receipt> = {
  deadLetterReasons: {
    attemptsExhausted: 'meta_attempts_exhausted',
    invalidPayload: 'invalid_canonical_payload',
    permanentError: 'meta_permanent_error'
  },
  dispatch: async () => ({
    accepted: 1,
    providerRequestId: 'request-1'
  }),
  eventName: 'page_view',
  isRetryable: () => false,
  key: 'meta:page_view',
  projectReceipt: receipt => ({
    requestId: receipt.providerRequestId,
    response: { accepted: receipt.accepted },
    validationResult: { events_received: receipt.accepted }
  }),
  provider: 'meta',
  retryPolicy: {
    delaysMs: [60_000],
    maxAttempts: 2,
    positiveJitterRatio: 0
  },
  schema: canonicalPageViewSchema,
  summarizeError: error => String(error)
}

function fakeExecutor(
  results: Array<Array<Record<string, unknown>>>
): {
  calls: QueryCall[]
  execute: ProviderOutboxQueryExecutor
} {
  const calls: QueryCall[] = []

  return {
    calls,
    execute: async <T extends Record<string, unknown>>(
      query: string,
      parameters: readonly unknown[]
    ) => {
      calls.push({ parameters, query })
      return (results.shift() ?? []) as T[]
    }
  }
}

function succeededOutcome(): Extract<
  ProviderAttemptOutcome<Receipt>,
  { status: 'succeeded' }
> {
  return {
    attemptCount: 1,
    attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    latencyMs: 125,
    receipt: {
      accepted: 1,
      providerRequestId: 'request-1'
    },
    status: 'succeeded'
  }
}

test('atomically claims only the adapter provider and event', async () => {
  const fake = fakeExecutor([
    [
      {
        attempt_count: 2,
        attempt_id: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
        payload: { event_name: 'page_view' }
      }
    ]
  ])
  const database = createPostgresProviderOutboxDatabase(
    adapter,
    fake.execute
  )

  const claimed = await database.claimNext()

  assert.deepEqual(claimed, {
    attemptCount: 2,
    attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    payload: { event_name: 'page_view' }
  })
  assert.deepEqual(fake.calls[0]?.parameters, [
    'meta',
    'page_view',
    null
  ])
  assert.match(fake.calls[0]?.query ?? '', /for update skip locked/i)
  assert.match(
    fake.calls[0]?.query ?? '',
    /status in \('pending', 'retry_scheduled'\)/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /status = 'processing'[\s\S]*interval '5 minutes'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /dispatch_mode = 'server_retry'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /created_at >= \$3::timestamptz/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /attempt_count = attempt\.attempt_count \+ 1/i
  )
})

test('applies an adapter cutover without replaying older rows', async () => {
  const fake = fakeExecutor([[]])
  const database = createPostgresProviderOutboxDatabase(
    {
      ...adapter,
      claimNotBefore: '2026-07-18T13:13:10.000Z'
    },
    fake.execute
  )

  await database.claimNext()

  assert.deepEqual(fake.calls[0]?.parameters, [
    'meta',
    'page_view',
    '2026-07-18T13:13:10.000Z'
  ])
})

test('targeted claim includes the exact attempt primary key and cannot take another row', async () => {
  const fake = fakeExecutor([
    [
      {
        attempt_count: 1,
        attempt_id: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
        payload: { event_name: 'page_view' }
      }
    ]
  ])
  const database = createPostgresProviderOutboxDatabase(
    adapter,
    fake.execute
  )

  const claimed = await database.claimById?.(
    '7bcd24a4-190c-4eca-a834-5c9854bd54ea'
  )

  assert.equal(
    claimed?.attemptId,
    '7bcd24a4-190c-4eca-a834-5c9854bd54ea'
  )
  assert.deepEqual(fake.calls[0]?.parameters, [
    '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    'meta',
    'page_view',
    null
  ])
  assert.match(fake.calls[0]?.query ?? '', /where id = \$1::uuid/i)
  assert.match(
    fake.calls[0]?.query ?? '',
    /provider = \$2[\s\S]*event_name = \$3/i
  )
  assert.doesNotMatch(
    fake.calls[0]?.query ?? '',
    /order by[\s\S]*limit 1/i
  )
})

test('projects provider acceptance into accepted_unverified fields', async () => {
  const fake = fakeExecutor([
    [{ id: '7bcd24a4-190c-4eca-a834-5c9854bd54ea' }]
  ])
  const database = createPostgresProviderOutboxDatabase(
    adapter,
    fake.execute
  )

  await database.markAcceptedUnverified(succeededOutcome())

  assert.match(
    fake.calls[0]?.query ?? '',
    /status = 'accepted_unverified'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /response_semantics = 'provider_accepted_unverified'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /and attempt_count = \$7/i
  )
  assert.deepEqual(fake.calls[0]?.parameters, [
    '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    { accepted: 1 },
    'request-1',
    { events_received: 1 },
    null,
    125,
    1
  ])
})

test('schedules retry without marking the attempt processed', async () => {
  const fake = fakeExecutor([
    [{ id: '7bcd24a4-190c-4eca-a834-5c9854bd54ea' }]
  ])
  const database = createPostgresProviderOutboxDatabase(
    adapter,
    fake.execute
  )
  const outcome: Extract<
    ProviderAttemptOutcome<Receipt>,
    { status: 'retry_scheduled' }
  > = {
    attemptCount: 2,
    attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    errorMessage: 'temporary',
    latencyMs: 125,
    nextAttemptAt: '2026-07-15T10:01:00.000Z',
    status: 'retry_scheduled'
  }

  await database.markRetryScheduled(outcome)

  assert.match(fake.calls[0]?.query ?? '', /processed_at = null/i)
  assert.match(
    fake.calls[0]?.query ?? '',
    /and attempt_count = \$5/i
  )
  assert.deepEqual(fake.calls[0]?.parameters, [
    outcome.attemptId,
    outcome.nextAttemptAt,
    outcome.errorMessage,
    outcome.latencyMs,
    outcome.attemptCount
  ])
})

test('uses adapter-owned terminal reason and provider metadata', async () => {
  const fake = fakeExecutor([
    [{ id: '3387a158-165f-498e-a968-d75b833f86fb' }]
  ])
  const database = createPostgresProviderOutboxDatabase(
    adapter,
    fake.execute
  )
  const outcome: Extract<
    ProviderAttemptOutcome<Receipt>,
    { status: 'dead_lettered' }
  > = {
    attemptCount: 3,
    attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    errorMessage: 'exhausted',
    latencyMs: 125,
    reason: 'attempts_exhausted',
    status: 'dead_lettered'
  }

  await database.markDeadLettered(outcome)

  assert.match(
    fake.calls[0]?.query ?? '',
    /jsonb_build_object\('provider_dispatch_attempt_id'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /and attempt_count = \$6/i
  )
  assert.deepEqual(fake.calls[0]?.parameters, [
    outcome.attemptId,
    outcome.errorMessage,
    outcome.latencyMs,
    'meta_attempts_exhausted',
    'meta',
    outcome.attemptCount
  ])
})

test('uses adapter-owned invalid-payload reason', async () => {
  const fake = fakeExecutor([
    [{ id: '3387a158-165f-498e-a968-d75b833f86fb' }]
  ])
  const database = createPostgresProviderOutboxDatabase(
    adapter,
    fake.execute
  )

  await database.markInvalidPayload({
    attemptCount: 4,
    attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    errorMessage: 'invalid canonical event'
  })

  assert.match(
    fake.calls[0]?.query ?? '',
    /response_semantics = 'invalid_payload'/i
  )
  assert.match(
    fake.calls[0]?.query ?? '',
    /and attempt_count = \$5/i
  )
  assert.deepEqual(fake.calls[0]?.parameters, [
    '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
    'invalid canonical event',
    'meta',
    'invalid_canonical_payload',
    4
  ])
})

test('rejects completion when processing ownership was lost', async () => {
  const fake = fakeExecutor([[]])
  const database = createPostgresProviderOutboxDatabase(
    adapter,
    fake.execute
  )

  await assert.rejects(
    database.markAcceptedUnverified(succeededOutcome()),
    /meta:page_view outbox attempt .* no longer processing/i
  )
})
