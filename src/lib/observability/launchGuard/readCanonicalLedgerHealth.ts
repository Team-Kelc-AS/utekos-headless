import 'server-only'

import postgres from 'postgres'
import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'

type QueryRow = Record<string, unknown>

export type CanonicalLedgerHealthQueryExecutor = (
  query: string,
  parameters: readonly unknown[]
) => Promise<QueryRow[]>

let launchGuardSql: ReturnType<typeof postgres> | undefined

function getLaunchGuardSql() {
  const connectionString =
    process.env.SUPABASE_VERCEL_POSTGRES_URL ??
    process.env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error('launch_guard_database_not_configured')
  }

  launchGuardSql ??= postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    max_lifetime: 60 * 30,
    prepare: false
  })

  return launchGuardSql
}

const executePostgresQuery: CanonicalLedgerHealthQueryExecutor =
  async (
    query: string,
    parameters: readonly unknown[]
  ) => {
    const sql = getLaunchGuardSql()
    const postgresParameters = parameters as Parameters<
      typeof sql.unsafe
    >[1]

    return sql.unsafe<QueryRow[]>(query, postgresParameters)
  }

const LEDGER_ROUTE_FRESHNESS_QUERY = `
  select
    count(*) filter (
      where created_at >= now() - interval '15 minutes'
    )::integer as recent_event_count,
    greatest(
      0,
      floor(
        extract(epoch from (now() - max(created_at)))
      )
    )::integer as data_freshness_seconds
  from marketing.event_ledger
  where source_url like $1 escape '\\'
`

function nonnegativeInteger(value: unknown) {
  const parsed =
    typeof value === 'number' ? value : Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

export async function readCanonicalLedgerHealth(input: {
  executeQuery?: CanonicalLedgerHealthQueryExecutor
  now: () => Date
  routePageviews: number | null
  runId: string
}) {
  const checkedAt = input.now().toISOString()

  try {
    const rows = await (
      input.executeQuery ?? executePostgresQuery
    )(LEDGER_ROUTE_FRESHNESS_QUERY, [
      'https://utekos.no/skreddersy-varmen%'
    ])
    const row = rows[0] ?? {}
    const recentEventCount = nonnegativeInteger(
      row.recent_event_count
    )
    const dataFreshnessSeconds =
      row.data_freshness_seconds === null ||
      row.data_freshness_seconds === undefined ?
        null
      : nonnegativeInteger(row.data_freshness_seconds)
    const trafficSupportsFailure =
      input.routePageviews !== null &&
      input.routePageviews >= 10
    const ledgerIsStale =
      dataFreshnessSeconds === null ||
      dataFreshnessSeconds >= 15 * 60
    const missingDespiteTraffic =
      trafficSupportsFailure &&
      recentEventCount === 0 &&
      ledgerIsStale
    const status =
      missingDespiteTraffic ? 'unhealthy'
      : recentEventCount > 0 ? 'healthy'
      : 'unknown'

    return parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'supabase',
      surface: 'skreddersy_varmen_ledger_freshness',
      status,
      severity:
        missingDespiteTraffic ? 'critical'
        : status === 'healthy' ? 'info'
        : 'low',
      checkedAt,
      ...(dataFreshnessSeconds === null ?
        {}
      : { dataFreshnessSeconds }),
      trafficWindowSeconds: 15 * 60,
      sampleCount: Math.max(
        recentEventCount,
        input.routePageviews ?? 0
      ),
      errorCount: missingDespiteTraffic ? 1 : 0,
      evidenceLevel: 'internal_ledger',
      providerReceiptStatus: 'not_applicable',
      ...(missingDespiteTraffic ?
        {
          errorFingerprint:
            'supabase:ledger:skreddersy_varmen_missing_with_traffic'
        }
      : {}),
      resultCode:
        missingDespiteTraffic ?
          'ledger_missing_with_verified_route_traffic'
        : recentEventCount > 0 ?
          'ledger_route_events_fresh'
        : 'ledger_route_traffic_insufficient_for_conclusion',
      measurements: {
        ledger_event_count: recentEventCount,
        vercel_pageviews: input.routePageviews
      }
    })
  } catch {
    return parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'supabase',
      surface: 'skreddersy_varmen_ledger_freshness',
      status: 'unhealthy',
      severity: 'high',
      checkedAt,
      trafficWindowSeconds: 15 * 60,
      sampleCount: 1,
      errorCount: 1,
      evidenceLevel: 'internal_ledger',
      providerReceiptStatus: 'rejected',
      errorFingerprint: 'supabase:ledger:readback_failed',
      resultCode: 'ledger_readback_failed',
      safeAction: 'retry_probe_once',
      measurements: {
        vercel_pageviews: input.routePageviews
      }
    })
  }
}
