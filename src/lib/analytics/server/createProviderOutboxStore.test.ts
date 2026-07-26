import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from '../pageViewEvent'
import { createProviderOutboxStore } from './createProviderOutboxStore'
import type { ProviderAdapter } from './providerAdapter'
import type {
  ProviderAttemptOutcome,
  ProviderOutboxDatabase,
  RawProviderOutboxAttempt
} from './providerOutboxTypes'

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
    delaysMs: [60_000],
    maxAttempts: 2,
    positiveJitterRatio: 0
  },
  schema: canonicalPageViewSchema,
  summarizeError: error => String(error)
}

function rawAttempt(
  attemptId: string,
  payload: unknown = pageView()
): RawProviderOutboxAttempt {
  return { attemptCount: 1, attemptId, payload }
}

function fakeDatabase(attempts: RawProviderOutboxAttempt[]) {
  const queue = [...attempts]
  const accepted: ProviderAttemptOutcome<Receipt>[] = []
  const deadLettered: ProviderAttemptOutcome<Receipt>[] = []
  const invalid: Array<{
    attemptCount: number
    attemptId: string
    errorMessage: string
  }> = []
  const retries: ProviderAttemptOutcome<Receipt>[] = []
  let claims = 0

  const database: ProviderOutboxDatabase<Receipt> = {
    claimById: async attemptId => {
      claims += 1
      const index = queue.findIndex(
        attempt => attempt.attemptId === attemptId
      )
      if (index < 0) return null
      return queue.splice(index, 1)[0] ?? null
    },
    claimNext: async () => {
      claims += 1
      return queue.shift() ?? null
    },
    markAcceptedUnverified: async outcome => {
      accepted.push(outcome)
    },
    markDeadLettered: async outcome => {
      deadLettered.push(outcome)
    },
    markInvalidPayload: async failure => {
      invalid.push(failure)
    },
    markRetryScheduled: async outcome => {
      retries.push(outcome)
    }
  }

  return {
    accepted,
    database,
    deadLettered,
    get claims() {
      return claims
    },
    invalid,
    queue,
    retries
  }
}

test('claims only the requested attempt primary key', async () => {
  const first = rawAttempt(
    '7bcd24a4-190c-4eca-a834-5c9854bd54ea'
  )
  const requested = rawAttempt(
    '3387a158-165f-498e-a968-d75b833f86fb'
  )
  const fake = fakeDatabase([first, requested])
  const store = createProviderOutboxStore(adapter, fake.database)

  const claimed = await store.claimById?.(requested.attemptId)

  assert.equal(claimed?.attemptId, requested.attemptId)
  assert.deepEqual(fake.queue, [first])
})

test('dead-letters an invalid payload and continues to a valid row', async () => {
  const invalidAttempt = rawAttempt('attempt-invalid', {
    event_name: 'page_view'
  })
  const validAttempt = rawAttempt('attempt-valid')
  const fake = fakeDatabase([invalidAttempt, validAttempt])
  const store = createProviderOutboxStore(adapter, fake.database)

  const claimed = await store.claimNext()

  assert.equal(fake.invalid.length, 1)
  assert.equal(fake.invalid[0]?.attemptId, 'attempt-invalid')
  assert.match(
    fake.invalid[0]?.errorMessage ?? '',
    /^Invalid canonical page_view payload:/
  )
  assert.deepEqual(claimed, {
    attemptCount: 1,
    attemptId: 'attempt-valid',
    event: pageView()
  })
})

test('parses a legacy canonical payload stored as JSON text', async () => {
  const fake = fakeDatabase([
    rawAttempt('attempt-json', JSON.stringify(pageView()))
  ])
  const store = createProviderOutboxStore(adapter, fake.database)

  const claimed = await store.claimNext()

  assert.deepEqual(fake.invalid, [])
  assert.deepEqual(claimed?.event, pageView())
})

test('stops after ten invalid rows in one claim operation', async () => {
  const attempts = Array.from({ length: 11 }, (_, index) =>
    rawAttempt(`attempt-${index}`, { event_name: 'page_view' })
  )
  const fake = fakeDatabase(attempts)
  const store = createProviderOutboxStore(adapter, fake.database)

  const claimed = await store.claimNext()

  assert.equal(claimed, null)
  assert.equal(fake.claims, 10)
  assert.equal(fake.invalid.length, 10)
  assert.equal(fake.queue.length, 1)
})

test('routes every completion outcome to its database transition', async () => {
  const fake = fakeDatabase([])
  const store = createProviderOutboxStore(adapter, fake.database)
  const succeeded: ProviderAttemptOutcome<Receipt> = {
    attemptCount: 1,
    attemptId: 'attempt-success',
    latencyMs: 20,
    receipt: { requestId: 'request-1' },
    status: 'succeeded'
  }
  const retry: ProviderAttemptOutcome<Receipt> = {
    attemptCount: 2,
    attemptId: 'attempt-retry',
    errorMessage: 'temporary',
    latencyMs: 25,
    nextAttemptAt: '2026-07-15T10:01:00.000Z',
    status: 'retry_scheduled'
  }
  const deadLettered: ProviderAttemptOutcome<Receipt> = {
    attemptCount: 3,
    attemptId: 'attempt-dead',
    errorMessage: 'permanent',
    latencyMs: 30,
    reason: 'permanent_error',
    status: 'dead_lettered'
  }

  await store.complete(succeeded)
  await store.complete(retry)
  await store.complete(deadLettered)

  assert.deepEqual(fake.accepted, [succeeded])
  assert.deepEqual(fake.retries, [retry])
  assert.deepEqual(fake.deadLettered, [deadLettered])
})
