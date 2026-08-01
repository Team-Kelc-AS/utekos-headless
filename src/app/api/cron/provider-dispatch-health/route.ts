import * as Sentry from '@sentry/nextjs'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
import { postgresProviderDispatchHealthStore } from '@/lib/analytics/server/postgresProviderDispatchHealthStore'
import { runProviderDispatchHealthCheck } from '@/lib/analytics/server/providerDispatchHealth'

export const maxDuration = 60

export type ProviderDispatchHealthCronDependencies = {
  getCronSecret: () => string | undefined
  runHealthCheck: typeof runProviderDispatchHealthCheck
}

const defaultDependencies: ProviderDispatchHealthCronDependencies =
  {
    getCronSecret: () => process.env.CRON_SECRET,
    runHealthCheck: dependencies =>
      runProviderDispatchHealthCheck(dependencies)
  }

export async function handleProviderDispatchHealthCron(
  request: Request,
  dependencies: ProviderDispatchHealthCronDependencies = defaultDependencies
) {
  const authorized = hasValidCronAuthorization(
    request.headers.get('authorization'),
    dependencies.getCronSecret()
  )

  if (!authorized) {
    return Response.json(
      { ok: false },
      { headers: { 'Cache-Control': 'no-store' }, status: 401 }
    )
  }

  const result = await dependencies.runHealthCheck({
    captureMessage: Sentry.captureMessage,
    store: postgresProviderDispatchHealthStore
  })

  return Response.json(
    {
      ack_sample_size: result.ackSampleSize,
      click_to_edge_baseline_day_count:
        result.clickToEdgeBaselineDayCount,
      click_to_edge_baseline_rate:
        result.clickToEdgeBaselineRate,
      click_to_edge_current_date: result.clickToEdgeCurrentDate,
      click_to_edge_current_click_id_count:
        result.clickToEdgeCurrentClickIdCount,
      click_to_edge_current_edge_count:
        result.clickToEdgeCurrentEdgeCount,
      click_to_edge_current_outbound_clicks:
        result.clickToEdgeCurrentOutboundClicks,
      click_to_edge_current_signal_without_click_id_count:
        result.clickToEdgeCurrentSignalWithoutClickIdCount,
      click_to_edge_current_successful_edge_count:
        result.clickToEdgeCurrentSuccessfulEdgeCount,
      click_to_edge_rate: result.clickToEdgeRate,
      click_to_edge_success_rate: result.clickToEdgeSuccessRate,
      dead_lettered: result.deadLettered.length,
      edge_meta_click_id_coverage:
        result.edgeMetaClickIdCoverage,
      edge_meta_landing_count: result.edgeMetaLandingCount,
      fbc_given_fbclid_coverage: result.fbcGivenFbclidCoverage,
      fbclid_page_view_count: result.fbclidPageViewCount,
      healthy: result.healthy,
      initial_pending_over_two_minutes:
        result.initialPendingOverTwoMinutes.length,
      invalid_ledger_events: result.invalidLedgerEvents.length,
      missing_provider_attempts:
        result.missingProviderAttempts.length,
      meta_api_acceptance_rate: result.metaApiAcceptanceRate,
      meta_eligible_sample_size: result.metaEligibleSampleSize,
      ok: true,
      p95_ack_latency_ms: result.p95AckLatencyMs
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleProviderDispatchHealthCron(request)
}
