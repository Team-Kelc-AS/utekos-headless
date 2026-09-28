import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from '@/lib/analytics/pageViewEvent'
import type { ProviderAdapter } from '@/lib/analytics/server/providerAdapter'
import { processProviderOutboxAttempt } from '@/lib/analytics/server/processProviderOutboxAttempt'

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

function createAdapter(
  overrides: Partial<ProviderAdapter<CanonicalPageView, Receipt>> = {}
): ProviderAdapter<CanonicalPageView, Receipt> {
  return {
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
      delaysMs: [1000, 5000],
      maxAttempts: 3,
      positiveJitterRatio: 0
    },
    schema: canonicalPageViewSchema,
    summarizeError: error => `Safe: ${String(error)}`,
    ...overrides
  }
}

function clock(...values: number[]) {
  let index = 0
  return () => values[index++]!
}

test('dispatches the unchanged canonical event and records latency', async () => {
  const event = pageView()
  let dispatchedEvent: CanonicalPageView | undefined
  const adapter = createAdapter({
    dispatch: async candidate => {
      dispatchedEvent = candidate
      return { requestId: 'request-success' }
    }
  })

  const outcome = await processProviderOutboxAttempt(
    { attemptCount: 1, attemptId: 'attempt-1', event },
    adapter,
    { now: clock(100, 145), random: () => 0 }
  )

  assert.equal(dispatchedEvent, event)
  assert.deepEqual(outcome, {
    attemptCount: 1,
    attemptId: 'attempt-1',
    latencyMs: 45,
    receipt: { requestId: 'request-success' },
    status: 'succeeded'
  })
})

test('schedules a retry without sampling randomness when jitter is disabled', async () => {
  const failure = new Error('temporary')
  const adapter = createAdapter({
    dispatch: async () => {
      throw failure
    },
    isRetryable: error => error === failure
  })

  const outcome = await processProviderOutboxAttempt(
    { attemptCount: 1, attemptId: 'attempt-1', event: pageView() },
    adapter,
    {
      now: clock(1000, 1100),
      random: () => {
        throw new Error('random must not be called')
      }
    }
  )

  assert.deepEqual(outcome, {
    attemptCount: 1,
    attemptId: 'attempt-1',
    errorMessage: 'Safe: Error: temporary',
    latencyMs: 100,
    nextAttemptAt: new Date(2100).toISOString(),
    status: 'retry_scheduled'
  })
})

test('clamps configured positive jitter to the interval zero through one', async () => {
  const failure = new Error('temporary')
  const adapter = createAdapter({
    dispatch: async () => {
      throw failure
    },
    isRetryable: () => true,
    retryPolicy: {
      delaysMs: [1000, 5000],
      maxAttempts: 3,
      positiveJitterRatio: 0.2
    }
  })

  const upper = await processProviderOutboxAttempt(
    { attemptCount: 1, attemptId: 'attempt-upper', event: pageView() },
    adapter,
    { now: clock(1000, 1100), random: () => 8 }
  )
  const lower = await processProviderOutboxAttempt(
    { attemptCount: 1, attemptId: 'attempt-lower', event: pageView() },
    adapter,
    { now: clock(1000, 1100), random: () => -8 }
  )

  assert.equal(
    upper.status === 'retry_scheduled' ? upper.nextAttemptAt : '',
    new Date(2300).toISOString()
  )
  assert.equal(
    lower.status === 'retry_scheduled' ? lower.nextAttemptAt : '',
    new Date(2100).toISOString()
  )
})

test('dead-letters a non-retryable error using the adapter summary', async () => {
  const adapter = createAdapter({
    dispatch: async () => {
      throw new Error('invalid')
    }
  })

  const outcome = await processProviderOutboxAttempt(
    { attemptCount: 1, attemptId: 'attempt-1', event: pageView() },
    adapter,
    { now: clock(100, 120), random: () => 0 }
  )

  assert.deepEqual(outcome, {
    attemptCount: 1,
    attemptId: 'attempt-1',
    errorMessage: 'Safe: Error: invalid',
    latencyMs: 20,
    reason: 'permanent_error',
    status: 'dead_lettered'
  })
})

test('dead-letters a retryable error after max attempts', async () => {
  const adapter = createAdapter({
    dispatch: async () => {
      throw new Error('still unavailable')
    },
    isRetryable: () => true
  })

  const outcome = await processProviderOutboxAttempt(
    { attemptCount: 3, attemptId: 'attempt-3', event: pageView() },
    adapter,
    { now: clock(100, 130), random: () => 0 }
  )

  assert.equal(outcome.status, 'dead_lettered')
  assert.equal(
    outcome.status === 'dead_lettered' ? outcome.reason : '',
    'attempts_exhausted'
  )
})

test('rejects an incomplete retry policy before dispatch', async () => {
  let dispatches = 0
  const adapter = createAdapter({
    dispatch: async () => {
      dispatches += 1
      return { requestId: 'request-1' }
    },
    retryPolicy: {
      delaysMs: [1000],
      maxAttempts: 3,
      positiveJitterRatio: 0
    }
  })

  await assert.rejects(
    processProviderOutboxAttempt(
      { attemptCount: 1, attemptId: 'attempt-1', event: pageView() },
      adapter
    ),
    /retry delays must contain maxAttempts - 1 entries/
  )
  assert.equal(dispatches, 0)
})
