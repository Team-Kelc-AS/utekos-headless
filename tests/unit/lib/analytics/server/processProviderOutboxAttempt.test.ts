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
      preferences: 'granted',
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

function claimed(
  attemptCount: number,
  attemptId: string,
  event: CanonicalPageView = pageView(),
  createdAt = '2026-07-15T09:59:00.000Z'
) {
  return { attemptCount, attemptId, createdAt, event }
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
    claimed(1, 'attempt-1', event),
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
    claimed(1, 'attempt-1'),
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
    claimed(1, 'attempt-upper'),
    adapter,
    { now: clock(1000, 1100), random: () => 8 }
  )
  const lower = await processProviderOutboxAttempt(
    claimed(1, 'attempt-lower'),
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
    claimed(1, 'attempt-1'),
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
    claimed(3, 'attempt-3'),
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
      claimed(1, 'attempt-1'),
      adapter
    ),
    /retry delays must contain maxAttempts - 1 entries/
  )
  assert.equal(dispatches, 0)
})

test('measures Meta queue age from attempt createdAt, not event_time', async () => {
  const metrics: Array<{
    name: string
    tags?: Record<string, string>
    value: number
  }> = []
  const previousMetric = (
    globalThis as {
      [key: symbol]:
        | { sendMetric?: typeof metrics.push }
        | undefined
    }
  )[Symbol.for('@vercel/rusty-runtime-ipc')]
  ;(
    globalThis as {
      [key: symbol]: { sendMetric: typeof metrics.push }
    }
  )[Symbol.for('@vercel/rusty-runtime-ipc')] = {
    sendMetric: (name, value, tags) => {
      metrics.push({ name, value, ...(tags ? { tags } : {}) })
    }
  }

  try {
    const createdAt = '2026-07-15T09:59:00.000Z'
    const startedAt = Date.parse(createdAt) + 1500
    await processProviderOutboxAttempt(
      claimed(2, 'attempt-retry', pageView(), createdAt),
      createAdapter(),
      { now: clock(startedAt, startedAt + 10), random: () => 0 }
    )

    assert.deepEqual(
      metrics.filter(entry => entry.name === 'meta.capi.queue_age_ms'),
      [
        {
          name: 'meta.capi.queue_age_ms',
          tags: {
            attempt: 'retry',
            event: 'page_view'
          },
          value: 1500
        }
      ]
    )
  } finally {
    ;(
      globalThis as {
        [key: symbol]: typeof previousMetric
      }
    )[Symbol.for('@vercel/rusty-runtime-ipc')] = previousMetric
  }
})

test('does not emit Meta queue age for non-Meta providers', async () => {
  const metrics: Array<{ name: string }> = []
  const ipcSymbol = Symbol.for('@vercel/rusty-runtime-ipc')
  const previousMetric = (
    globalThis as {
      [key: symbol]:
        | { sendMetric?: (name: string) => void }
        | undefined
    }
  )[ipcSymbol]
  ;(
    globalThis as {
      [key: symbol]: { sendMetric: (name: string) => void }
    }
  )[ipcSymbol] = {
    sendMetric: name => {
      metrics.push({ name })
    }
  }

  try {
    await processProviderOutboxAttempt(
      claimed(1, 'attempt-1'),
      createAdapter({
        key: 'microsoft_uet:page_view',
        provider: 'microsoft_uet'
      }),
      { now: clock(100, 110), random: () => 0 }
    )

    assert.deepEqual(metrics, [])
  } finally {
    ;(
      globalThis as {
        [key: symbol]: typeof previousMetric
      }
    )[ipcSymbol] = previousMetric
  }
})