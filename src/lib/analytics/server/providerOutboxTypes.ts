import type { CanonicalEvent } from '../canonicalEvent'

export type RawProviderOutboxAttempt = {
  attemptCount: number
  attemptId: string
  payload: unknown
}

export type ClaimedProviderOutboxAttempt<
  E extends CanonicalEvent
> = {
  attemptCount: number
  attemptId: string
  event: E
}

export type ProviderAttemptOutcome<R> =
  | {
      attemptCount: number
      attemptId: string
      latencyMs: number
      receipt: R
      status: 'succeeded'
    }
  | {
      attemptCount: number
      attemptId: string
      errorMessage: string
      latencyMs: number
      nextAttemptAt: string
      status: 'retry_scheduled'
    }
  | {
      attemptCount: number
      attemptId: string
      errorMessage: string
      latencyMs: number
      reason: 'attempts_exhausted' | 'permanent_error'
      status: 'dead_lettered'
    }

type SucceededProviderAttempt<R> = Extract<
  ProviderAttemptOutcome<R>,
  { status: 'succeeded' }
>

type RetryScheduledProviderAttempt<R> = Extract<
  ProviderAttemptOutcome<R>,
  { status: 'retry_scheduled' }
>

type DeadLetteredProviderAttempt<R> = Extract<
  ProviderAttemptOutcome<R>,
  { status: 'dead_lettered' }
>

export type ProviderOutboxDatabase<R> = {
  claimById?: (
    attemptId: string
  ) => Promise<RawProviderOutboxAttempt | null>
  claimNext: () => Promise<RawProviderOutboxAttempt | null>
  markAcceptedUnverified: (
    outcome: SucceededProviderAttempt<R>
  ) => Promise<void>
  markDeadLettered: (
    outcome: DeadLetteredProviderAttempt<R>
  ) => Promise<void>
  markInvalidPayload: (failure: {
    attemptCount: number
    attemptId: string
    errorMessage: string
  }) => Promise<void>
  markRetryScheduled: (
    outcome: RetryScheduledProviderAttempt<R>
  ) => Promise<void>
}

export type ProviderOutboxStore<
  E extends CanonicalEvent,
  R
> = {
  claimById?: (
    attemptId: string
  ) => Promise<ClaimedProviderOutboxAttempt<E> | null>
  claimNext: () => Promise<ClaimedProviderOutboxAttempt<E> | null>
  complete: (outcome: ProviderAttemptOutcome<R>) => Promise<void>
}
