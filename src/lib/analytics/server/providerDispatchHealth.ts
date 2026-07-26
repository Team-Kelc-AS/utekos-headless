import * as Sentry from '@sentry/nextjs'
import { parseCanonicalEvent } from '../canonicalEvent'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

export type ProviderDispatchHealthLedgerCandidate = {
  eventId: string
  eventName: string
  payload: unknown
  providers: string[]
}

export type ProviderDispatchHealthProblemAttempt = {
  attemptId: string
  eventId: string | null
  eventName: string | null
  issueCode: 'dead_lettered' | 'initial_pending_over_two_minutes'
  provider: string
}

export type ProviderDispatchHealthSnapshot = {
  ackSampleSize: number
  ledgerCandidates: ProviderDispatchHealthLedgerCandidate[]
  p95AckLatencyMs: number | null
  problemAttempts: ProviderDispatchHealthProblemAttempt[]
}

export type MissingProviderAttempt = {
  adapterKey: string
  eventId: string
  eventName: string
}

export type ProviderDispatchHealthEvaluation = {
  ackSampleSize: number
  deadLettered: ProviderDispatchHealthProblemAttempt[]
  healthy: boolean
  initialPendingOverTwoMinutes: ProviderDispatchHealthProblemAttempt[]
  invalidLedgerEvents: Array<{
    eventId: string
    eventName: string
  }>
  missingProviderAttempts: MissingProviderAttempt[]
  p95AckLatencyMs: number | null
}

export type ProviderDispatchHealthStore = {
  readSnapshot: () => Promise<ProviderDispatchHealthSnapshot>
}

export type ProviderDispatchHealthDependencies = {
  captureMessage: typeof Sentry.captureMessage
  store: ProviderDispatchHealthStore
}

function unique(values: string[]) {
  return [...new Set(values)]
}

export function evaluateProviderDispatchHealth(
  snapshot: ProviderDispatchHealthSnapshot
): ProviderDispatchHealthEvaluation {
  const missingProviderAttempts: MissingProviderAttempt[] = []
  const invalidLedgerEvents: Array<{
    eventId: string
    eventName: string
  }> = []

  for (const candidate of snapshot.ledgerCandidates) {
    try {
      const event = parseCanonicalEvent(candidate.payload)
      const actualProviders = new Set(candidate.providers)
      const expectedProviders = unique(
        planCanonicalEventDispatch(event).map(
          dispatch => dispatch.provider
        )
      )

      for (const provider of expectedProviders) {
        if (actualProviders.has(provider)) continue
        missingProviderAttempts.push({
          adapterKey: `${provider}:${event.event_name}`,
          eventId: event.event_id,
          eventName: event.event_name
        })
      }
    } catch {
      invalidLedgerEvents.push({
        eventId: candidate.eventId,
        eventName: candidate.eventName
      })
    }
  }

  const deadLettered = snapshot.problemAttempts.filter(
    attempt => attempt.issueCode === 'dead_lettered'
  )
  const initialPendingOverTwoMinutes =
    snapshot.problemAttempts.filter(
      attempt =>
        attempt.issueCode ===
        'initial_pending_over_two_minutes'
    )
  const p95Exceeded =
    snapshot.p95AckLatencyMs !== null &&
    snapshot.p95AckLatencyMs > 60_000

  return {
    ackSampleSize: snapshot.ackSampleSize,
    deadLettered,
    healthy:
      missingProviderAttempts.length === 0 &&
      invalidLedgerEvents.length === 0 &&
      initialPendingOverTwoMinutes.length === 0 &&
      deadLettered.length === 0 &&
      !p95Exceeded,
    initialPendingOverTwoMinutes,
    invalidLedgerEvents,
    missingProviderAttempts,
    p95AckLatencyMs: snapshot.p95AckLatencyMs
  }
}

function captureHealthIssue(
  code: string,
  extra: Record<string, unknown>,
  captureMessage: typeof Sentry.captureMessage
) {
  captureMessage(`Canonical provider dispatch health: ${code}`, {
    extra,
    fingerprint: ['canonical-provider-dispatch-health', code],
    level: 'error',
    tags: {
      analytics_stage: 'provider_dispatch_health',
      health_issue: code
    }
  })
}

export async function runProviderDispatchHealthCheck(
  dependencies: ProviderDispatchHealthDependencies
) {
  const evaluation = evaluateProviderDispatchHealth(
    await dependencies.store.readSnapshot()
  )

  if (evaluation.missingProviderAttempts.length > 0) {
    captureHealthIssue(
      'missing_provider_attempt',
      {
        count: evaluation.missingProviderAttempts.length,
        samples: evaluation.missingProviderAttempts.slice(0, 20)
      },
      dependencies.captureMessage
    )
  }

  if (evaluation.invalidLedgerEvents.length > 0) {
    captureHealthIssue(
      'invalid_canonical_ledger_payload',
      {
        count: evaluation.invalidLedgerEvents.length,
        samples: evaluation.invalidLedgerEvents.slice(0, 20)
      },
      dependencies.captureMessage
    )
  }

  if (evaluation.initialPendingOverTwoMinutes.length > 0) {
    captureHealthIssue(
      'initial_pending_over_two_minutes',
      {
        count: evaluation.initialPendingOverTwoMinutes.length,
        samples: evaluation.initialPendingOverTwoMinutes.slice(0, 20)
      },
      dependencies.captureMessage
    )
  }

  if (evaluation.deadLettered.length > 0) {
    captureHealthIssue(
      'dead_lettered',
      {
        count: evaluation.deadLettered.length,
        samples: evaluation.deadLettered.slice(0, 20)
      },
      dependencies.captureMessage
    )
  }

  if (
    evaluation.p95AckLatencyMs !== null &&
    evaluation.p95AckLatencyMs > 60_000
  ) {
    captureHealthIssue(
      'p95_ack_latency_over_60_seconds',
      {
        ack_sample_size: evaluation.ackSampleSize,
        p95_ack_latency_ms: evaluation.p95AckLatencyMs
      },
      dependencies.captureMessage
    )
  }

  return evaluation
}
