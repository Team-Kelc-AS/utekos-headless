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
  clickToEdgeBaselineDayCount: number
  clickToEdgeBaselineRate: number | null
  clickToEdgeCurrentClickIdCount: number
  clickToEdgeCurrentDate: string | null
  clickToEdgeCurrentEdgeCount: number
  clickToEdgeCurrentOutboundClicks: number
  clickToEdgeCurrentSignalWithoutClickIdCount: number
  clickToEdgeCurrentSuccessfulEdgeCount: number
  edgeMetaLandingCount: number
  edgeMetaLandingWithFbclidCount: number
  fbcAndFbclidPageViewCount: number
  fbclidPageViewCount: number
  ledgerCandidates: ProviderDispatchHealthLedgerCandidate[]
  metaAcceptedUnverifiedCount: number
  metaEligibleSampleSize: number
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
  clickToEdgeBaselineDayCount: number
  clickToEdgeBaselineRate: number | null
  clickToEdgeCurrentClickIdCount: number
  clickToEdgeCurrentDate: string | null
  clickToEdgeCurrentEdgeCount: number
  clickToEdgeCurrentOutboundClicks: number
  clickToEdgeCurrentSignalWithoutClickIdCount: number
  clickToEdgeCurrentSuccessfulEdgeCount: number
  clickToEdgeSuccessRate: number | null
  clickToEdgeRate: number | null
  deadLettered: ProviderDispatchHealthProblemAttempt[]
  edgeMetaClickIdCoverage: number | null
  edgeMetaLandingCount: number
  fbcGivenFbclidCoverage: number | null
  fbclidPageViewCount: number
  healthy: boolean
  initialPendingOverTwoMinutes: ProviderDispatchHealthProblemAttempt[]
  invalidLedgerEvents: Array<{
    eventId: string
    eventName: string
  }>
  missingProviderAttempts: MissingProviderAttempt[]
  metaApiAcceptanceRate: number | null
  metaEligibleSampleSize: number
  p95AckLatencyMs: number | null
}

export type ProviderDispatchHealthStore = {
  readSnapshot: () => Promise<ProviderDispatchHealthSnapshot>
}

export type ProviderDispatchHealthDependencies = {
  reportIssue: (code: string, metrics: Record<string, unknown>) => void
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
        attempt.issueCode === 'initial_pending_over_two_minutes'
    )
  const p95Exceeded =
    snapshot.p95AckLatencyMs !== null &&
    snapshot.p95AckLatencyMs > 60_000
  const metaApiAcceptanceRate =
    snapshot.metaEligibleSampleSize === 0 ?
      null
    : snapshot.metaAcceptedUnverifiedCount /
      snapshot.metaEligibleSampleSize
  const metaApiAcceptanceBelowThreshold =
    snapshot.metaEligibleSampleSize >= 20 &&
    metaApiAcceptanceRate !== null &&
    metaApiAcceptanceRate < 0.99
  const fbcGivenFbclidCoverage =
    snapshot.fbclidPageViewCount === 0 ?
      null
    : snapshot.fbcAndFbclidPageViewCount /
      snapshot.fbclidPageViewCount
  const fbcCoverageBelowThreshold =
    snapshot.fbclidPageViewCount >= 50 &&
    fbcGivenFbclidCoverage !== null &&
    fbcGivenFbclidCoverage < 0.98
  const edgeMetaClickIdCoverage =
    snapshot.edgeMetaLandingCount === 0 ?
      null
    : snapshot.edgeMetaLandingWithFbclidCount /
      snapshot.edgeMetaLandingCount
  const edgeMetaClickIdCoverageBelowThreshold =
    snapshot.edgeMetaLandingCount >= 50 &&
    edgeMetaClickIdCoverage !== null &&
    edgeMetaClickIdCoverage < 0.98
  const clickToEdgeRate =
    snapshot.clickToEdgeCurrentOutboundClicks === 0 ?
      null
    : snapshot.clickToEdgeCurrentEdgeCount /
      snapshot.clickToEdgeCurrentOutboundClicks
  const clickToEdgeSuccessRate =
    snapshot.clickToEdgeCurrentEdgeCount === 0 ?
      null
    : snapshot.clickToEdgeCurrentSuccessfulEdgeCount /
      snapshot.clickToEdgeCurrentEdgeCount
  const clickToEdgeBelowBaseline =
    snapshot.clickToEdgeCurrentOutboundClicks >= 50 &&
    snapshot.clickToEdgeBaselineDayCount >= 3 &&
    snapshot.clickToEdgeBaselineRate !== null &&
    clickToEdgeRate !== null &&
    clickToEdgeRate < snapshot.clickToEdgeBaselineRate * 0.8

  return {
    ackSampleSize: snapshot.ackSampleSize,
    clickToEdgeBaselineDayCount:
      snapshot.clickToEdgeBaselineDayCount,
    clickToEdgeBaselineRate: snapshot.clickToEdgeBaselineRate,
    clickToEdgeCurrentClickIdCount:
      snapshot.clickToEdgeCurrentClickIdCount,
    clickToEdgeCurrentDate: snapshot.clickToEdgeCurrentDate,
    clickToEdgeCurrentEdgeCount:
      snapshot.clickToEdgeCurrentEdgeCount,
    clickToEdgeCurrentOutboundClicks:
      snapshot.clickToEdgeCurrentOutboundClicks,
    clickToEdgeCurrentSignalWithoutClickIdCount:
      snapshot.clickToEdgeCurrentSignalWithoutClickIdCount,
    clickToEdgeCurrentSuccessfulEdgeCount:
      snapshot.clickToEdgeCurrentSuccessfulEdgeCount,
    clickToEdgeSuccessRate,
    clickToEdgeRate,
    deadLettered,
    edgeMetaClickIdCoverage,
    edgeMetaLandingCount: snapshot.edgeMetaLandingCount,
    fbcGivenFbclidCoverage,
    fbclidPageViewCount: snapshot.fbclidPageViewCount,
    healthy:
      missingProviderAttempts.length === 0 &&
      invalidLedgerEvents.length === 0 &&
      initialPendingOverTwoMinutes.length === 0 &&
      deadLettered.length === 0 &&
      !clickToEdgeBelowBaseline &&
      !edgeMetaClickIdCoverageBelowThreshold &&
      !fbcCoverageBelowThreshold &&
      !metaApiAcceptanceBelowThreshold &&
      !p95Exceeded,
    initialPendingOverTwoMinutes,
    invalidLedgerEvents,
    missingProviderAttempts,
    metaApiAcceptanceRate,
    metaEligibleSampleSize: snapshot.metaEligibleSampleSize,
    p95AckLatencyMs: snapshot.p95AckLatencyMs
  }
}

function captureHealthIssue(
  code: string,
  extra: Record<string, unknown>,
  reportIssue: ProviderDispatchHealthDependencies['reportIssue']
) {
  reportIssue(code, extra)
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
      dependencies.reportIssue
    )
  }

  if (evaluation.invalidLedgerEvents.length > 0) {
    captureHealthIssue(
      'invalid_canonical_ledger_payload',
      {
        count: evaluation.invalidLedgerEvents.length,
        samples: evaluation.invalidLedgerEvents.slice(0, 20)
      },
      dependencies.reportIssue
    )
  }

  if (evaluation.initialPendingOverTwoMinutes.length > 0) {
    captureHealthIssue(
      'initial_pending_over_two_minutes',
      {
        count: evaluation.initialPendingOverTwoMinutes.length,
        samples: evaluation.initialPendingOverTwoMinutes.slice(
          0,
          20
        )
      },
      dependencies.reportIssue
    )
  }

  if (evaluation.deadLettered.length > 0) {
    captureHealthIssue(
      'dead_lettered',
      {
        count: evaluation.deadLettered.length,
        samples: evaluation.deadLettered.slice(0, 20)
      },
      dependencies.reportIssue
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
      dependencies.reportIssue
    )
  }

  if (
    evaluation.edgeMetaLandingCount >= 50 &&
    evaluation.edgeMetaClickIdCoverage !== null &&
    evaluation.edgeMetaClickIdCoverage < 0.98
  ) {
    captureHealthIssue(
      'meta_edge_click_id_coverage_below_98_percent',
      {
        coverage: evaluation.edgeMetaClickIdCoverage,
        denominator: evaluation.edgeMetaLandingCount,
        definition:
          'human_or_unknown_meta_signal_document_with_fbclid',
        window: '24_hours'
      },
      dependencies.reportIssue
    )
  }

  if (
    evaluation.clickToEdgeCurrentOutboundClicks >= 50 &&
    evaluation.clickToEdgeBaselineDayCount >= 3 &&
    evaluation.clickToEdgeBaselineRate !== null &&
    evaluation.clickToEdgeRate !== null &&
    evaluation.clickToEdgeRate <
      evaluation.clickToEdgeBaselineRate * 0.8
  ) {
    captureHealthIssue(
      'meta_click_to_edge_rate_below_baseline',
      {
        baseline_days: evaluation.clickToEdgeBaselineDayCount,
        baseline_rate: evaluation.clickToEdgeBaselineRate,
        current_date: evaluation.clickToEdgeCurrentDate,
        current_edge_documents:
          evaluation.clickToEdgeCurrentEdgeCount,
        current_edge_documents_with_click_id:
          evaluation.clickToEdgeCurrentClickIdCount,
        current_edge_documents_with_signal_without_click_id:
          evaluation.clickToEdgeCurrentSignalWithoutClickIdCount,
        current_successful_edge_documents:
          evaluation.clickToEdgeCurrentSuccessfulEdgeCount,
        edge_success_rate: evaluation.clickToEdgeSuccessRate,
        current_outbound_clicks:
          evaluation.clickToEdgeCurrentOutboundClicks,
        current_rate: evaluation.clickToEdgeRate,
        definition:
          'human_or_unknown_meta_signal_document_per_meta_outbound_click',
        threshold: 'below_80_percent_of_baseline'
      },
      dependencies.reportIssue
    )
  }

  if (
    evaluation.fbclidPageViewCount >= 50 &&
    evaluation.fbcGivenFbclidCoverage !== null &&
    evaluation.fbcGivenFbclidCoverage < 0.98
  ) {
    captureHealthIssue(
      'fbc_given_fbclid_below_98_percent',
      {
        coverage: evaluation.fbcGivenFbclidCoverage,
        denominator: evaluation.fbclidPageViewCount,
        definition: 'consented_page_view_with_fbc_given_fbclid',
        window: '24_hours'
      },
      dependencies.reportIssue
    )
  }

  if (
    evaluation.metaEligibleSampleSize >= 20 &&
    evaluation.metaApiAcceptanceRate !== null &&
    evaluation.metaApiAcceptanceRate < 0.99
  ) {
    captureHealthIssue(
      'meta_api_acceptance_below_99_percent',
      {
        acceptance_semantics: 'accepted_unverified',
        acceptance_rate: evaluation.metaApiAcceptanceRate,
        eligible_sample_size: evaluation.metaEligibleSampleSize,
        provider_finality: 'not_proven'
      },
      dependencies.reportIssue
    )
  }

  return evaluation
}
