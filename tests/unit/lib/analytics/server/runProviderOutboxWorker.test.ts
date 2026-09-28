import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from '@/lib/analytics/pageViewEvent'
import type { ProviderAdapter } from '@/lib/analytics/server/providerAdapter'
import type {
  ClaimedProviderOutboxAttempt,
  ProviderAttemptOutcome,
  ProviderOutboxStore
} from '@/lib/analytics/server/providerOutboxTypes'
import { runProviderOutboxWorker } from '@/lib/analytics/server/runProviderOutboxWorker'

type Receipt = { requestId: string }

function pageView(): CanonicalPageView {
  return canonicalPageViewSchema.parse({
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    event_time: '2026-07-15T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/',
    page_title: 'Utekos',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    }
  })
}

const adapter: ProviderAdapter<CanonicalPageView, Receipt> = {
  deadLetterReasons: {
    attemptsExhausted: 'meta_attempts_exhausted',
    invalidPayload: 'invalid_canonical_payload',
    permanentError: 'meta_permanent_error'
  },
  dispatch: async () => ({ requestId: 'request-1' }),
  eventName: 'page_view',
  isRetryable: () => false,
  key: 'meta:page_view',
  projectReceipt: receipt => ({
    requestId: receipt.requestId,
    response: receipt,
    validationResult: { accepted: true }
  }),
  provider: 'meta',
  retryPolicy: {
    delaysMs: [1000],
    maxAttempts: 2,
    positiveJitterRatio: 0
  },
  schema: canonicalPageViewSchema,
  summarizeError: error => String(error)
}

function attempt(
  attemptCount: number
): ClaimedProviderOutboxAttempt<CanonicalPageView> {
  return {
    attemptCount,
    attemptId: `attempt-${attemptCount}`,
    event: pageView()
  }
}

function fakeStore(
  attempts: ClaimedProviderOutboxAttempt<CanonicalPageView>[]
) {
  const queue = [...attempts]
  const completed: ProviderAttemptOutcome<Receipt>[] = []
  const store: ProviderOutboxStore<CanonicalPageView, Receipt> = {
    claimNext: async () => queue.shift() ?? null,
    complete: async outcome => {
      completed.push(outcome)
    }
  }

  return { completed, store }
}

test('counts every terminal worker outcome and completes each claim', async () => {
  const fake = fakeStore([attempt(1), attempt(2), attempt(3)])

  const summary = await runProviderOutboxWorker(
    { maxItems: 3 },
    {
      adapter,
      processAttempt: async claimed => {
        if (claimed.attemptCount === 1) {
          return {
            attemptCount: claimed.attemptCount,
            attemptId: claimed.attemptId,
            latencyMs: 10,
            receipt: { requestId: 'request-1' },
            status: 'succeeded'
          }
        }
        if (claimed.attemptCount === 2) {
          return {
            attemptCount: claimed.attemptCount,
            attemptId: claimed.attemptId,
            errorMessage: 'temporary',
            latencyMs: 20,
            nextAttemptAt: '2026-07-15T10:01:00.000Z',
            status: 'retry_scheduled'
          }
        }
        return {
          attemptCount: claimed.attemptCount,
          attemptId: claimed.attemptId,
          errorMessage: 'permanent',
          latencyMs: 30,
          reason: 'permanent_error',
          status: 'dead_lettered'
        }
      },
      store: fake.store
    }
  )

  assert.deepEqual(summary, {
    acceptedUnverified: 1,
    claimed: 3,
    deadLettered: 1,
    limitReached: true,
    retryScheduled: 1
  })
  assert.deepEqual(
    fake.completed.map(outcome => outcome.status),
    ['succeeded', 'retry_scheduled', 'dead_lettered']
  )
})

test('stops without marking the limit reached when no row remains', async () => {
  const fake = fakeStore([attempt(1)])

  const summary = await runProviderOutboxWorker(
    { maxItems: 2 },
    {
      adapter,
      processAttempt: async claimed => ({
        attemptCount: claimed.attemptCount,
        attemptId: claimed.attemptId,
        latencyMs: 10,
        receipt: { requestId: 'request-1' },
        status: 'succeeded'
      }),
      store: fake.store
    }
  )

  assert.deepEqual(summary, {
    acceptedUnverified: 1,
    claimed: 1,
    deadLettered: 0,
    limitReached: false,
    retryScheduled: 0
  })
  assert.equal(fake.completed.length, 1)
})

test('uses the generic processor when no override is supplied', async () => {
  const event = pageView()
  let dispatchedEvent: CanonicalPageView | undefined
  const fake = fakeStore([
    { attemptCount: 1, attemptId: 'attempt-default', event }
  ])
  const dispatchingAdapter: ProviderAdapter<
    CanonicalPageView,
    Receipt
  > = {
    ...adapter,
    dispatch: async candidate => {
      dispatchedEvent = candidate
      return { requestId: 'request-default' }
    }
  }

  const summary = await runProviderOutboxWorker(
    { maxItems: 2 },
    { adapter: dispatchingAdapter, store: fake.store }
  )

  assert.equal(dispatchedEvent, event)
  assert.equal(summary.acceptedUnverified, 1)
  assert.equal(fake.completed[0]?.status, 'succeeded')
})

test('rejects non-integer and out-of-range batch sizes', async () => {
  const fake = fakeStore([])

  for (const maxItems of [0, 1.5, 101]) {
    await assert.rejects(
      runProviderOutboxWorker(
        { maxItems },
        { adapter, store: fake.store }
      ),
      /maxItems must be between 1 and 100/
    )
  }
})
