import { metric } from '@vercel/functions'
import type { CanonicalEvent } from '../canonicalEvent'
import type { ProviderAdapter } from './providerAdapter'
import type {
  ClaimedProviderOutboxAttempt,
  ProviderAttemptOutcome
} from './providerOutboxTypes'

export type ProviderAttemptDependencies = {
  now: () => number
  random: () => number
}

const defaultDependencies: ProviderAttemptDependencies = {
  now: Date.now,
  random: Math.random
}

function validateAttempt<
  E extends CanonicalEvent,
  R
>(
  attemptCount: number,
  adapter: ProviderAdapter<E, R>
) {
  const { delaysMs, maxAttempts, positiveJitterRatio } =
    adapter.retryPolicy

  if (!Number.isInteger(attemptCount) || attemptCount < 1) {
    throw new Error('Provider outbox attemptCount must be at least 1')
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error(
      `${adapter.key} retry maxAttempts must be at least 1`
    )
  }
  if (delaysMs.length !== maxAttempts - 1) {
    throw new Error(
      `${adapter.key} retry delays must contain maxAttempts - 1 entries`
    )
  }
  if (
    delaysMs.some(
      delay => !Number.isInteger(delay) || delay < 0
    )
  ) {
    throw new Error(
      `${adapter.key} retry delays must be non-negative integers`
    )
  }
  if (
    !Number.isFinite(positiveJitterRatio) ||
    positiveJitterRatio < 0 ||
    positiveJitterRatio > 1
  ) {
    throw new Error(
      `${adapter.key} positiveJitterRatio must be between 0 and 1`
    )
  }
}

function addPositiveJitter(
  delayMs: number,
  ratio: number,
  random: () => number
) {
  if (ratio === 0) return delayMs

  const sample = random()
  const normalizedSample =
    Number.isFinite(sample) ?
      Math.min(1, Math.max(0, sample))
    : 0

  return delayMs + Math.floor(
    delayMs * ratio * normalizedSample
  )
}

export async function processProviderOutboxAttempt<
  E extends CanonicalEvent,
  R
>(
  attempt: ClaimedProviderOutboxAttempt<E>,
  adapter: ProviderAdapter<E, R>,
  dependencies: ProviderAttemptDependencies = defaultDependencies
): Promise<ProviderAttemptOutcome<R>> {
  validateAttempt(attempt.attemptCount, adapter)

  const startedAt = dependencies.now()

  if (adapter.provider === 'meta') {
    try {
      metric(
        'meta.capi.queue_age_ms',
        Math.max(0, startedAt - Date.parse(attempt.createdAt)),
        {
          event: adapter.eventName,
          attempt:
            attempt.attemptCount === 1 ? 'initial' : 'retry'
        }
      )
    } catch {
      // Metrics must not affect Meta dispatch.
    }
  }

  try {
    const receipt = await adapter.dispatch(attempt.event)
    const finishedAt = dependencies.now()

    return {
      attemptCount: attempt.attemptCount,
      attemptId: attempt.attemptId,
      latencyMs: Math.max(0, finishedAt - startedAt),
      receipt,
      status: 'succeeded'
    }
  } catch (error) {
    const finishedAt = dependencies.now()
    const failure = {
      attemptCount: attempt.attemptCount,
      attemptId: attempt.attemptId,
      errorMessage: adapter.summarizeError(error),
      latencyMs: Math.max(0, finishedAt - startedAt)
    }

    if (
      adapter.isRetryable(error) &&
      attempt.attemptCount < adapter.retryPolicy.maxAttempts
    ) {
      const baseDelay =
        adapter.retryPolicy.delaysMs[attempt.attemptCount - 1]!
      const delay = addPositiveJitter(
        baseDelay,
        adapter.retryPolicy.positiveJitterRatio,
        dependencies.random
      )

      return {
        ...failure,
        nextAttemptAt: new Date(
          finishedAt + delay
        ).toISOString(),
        status: 'retry_scheduled'
      }
    }

    return {
      ...failure,
      reason:
        attempt.attemptCount >= adapter.retryPolicy.maxAttempts ?
          'attempts_exhausted'
        : 'permanent_error',
      status: 'dead_lettered'
    }
  }
}
