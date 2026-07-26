import * as Sentry from '@sentry/nextjs'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
import { postgresProviderDispatchHealthStore } from '@/lib/analytics/server/postgresProviderDispatchHealthStore'
import { runProviderDispatchHealthCheck } from '@/lib/analytics/server/providerDispatchHealth'

export const maxDuration = 60

export type ProviderDispatchHealthCronDependencies = {
  getCronSecret: () => string | undefined
  runHealthCheck: typeof runProviderDispatchHealthCheck
}

const defaultDependencies: ProviderDispatchHealthCronDependencies = {
  getCronSecret: () => process.env.CRON_SECRET,
  runHealthCheck: dependencies =>
    runProviderDispatchHealthCheck(dependencies)
}

export async function handleProviderDispatchHealthCron(
  request: Request,
  dependencies: ProviderDispatchHealthCronDependencies =
    defaultDependencies
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
      dead_lettered: result.deadLettered.length,
      healthy: result.healthy,
      initial_pending_over_two_minutes:
        result.initialPendingOverTwoMinutes.length,
      invalid_ledger_events: result.invalidLedgerEvents.length,
      missing_provider_attempts:
        result.missingProviderAttempts.length,
      ok: true,
      p95_ack_latency_ms: result.p95AckLatencyMs
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleProviderDispatchHealthCron(request)
}
