import 'server-only'
import postgres from 'postgres'
import type {
  ProviderDispatchHealthLedgerCandidate,
  ProviderDispatchHealthProblemAttempt,
  ProviderDispatchHealthSnapshot,
  ProviderDispatchHealthStore
} from './providerDispatchHealth'

type QueryRow = Record<string, unknown>

export type ProviderDispatchHealthQueryExecutor = <
  T extends QueryRow
>(
  query: string,
  parameters: readonly unknown[]
) => Promise<T[]>

let trackingSql: ReturnType<typeof postgres> | undefined

function getTrackingSql() {
  const connectionString =
    process.env.SUPABASE_VERCEL_POSTGRES_URL ??
    process.env.SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error(
      'Missing tracking database connection string'
    )
  }

  trackingSql ??= postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    max_lifetime: 60 * 30,
    prepare: false
  })

  return trackingSql
}

const executePostgresQuery: ProviderDispatchHealthQueryExecutor =
  async <T extends QueryRow>(
    query: string,
    parameters: readonly unknown[]
  ) => {
    const sql = getTrackingSql()
    const postgresParameters = parameters as Parameters<
      typeof sql.unsafe
    >[1]

    return sql.unsafe<T[]>(query, postgresParameters)
  }

const LEDGER_CANDIDATES_QUERY = `
  select
    ledger.event_id,
    ledger.event_name,
    ledger.payload,
    coalesce(
      jsonb_agg(distinct attempt.provider)
        filter (where attempt.provider is not null),
      '[]'::jsonb
    ) as providers
  from marketing.event_ledger as ledger
  left join ops.provider_dispatch_attempts as attempt
    on attempt.event_id = ledger.event_id
    and attempt.event_name = ledger.event_name
  where ledger.created_at >= now() - interval '30 minutes'
    and ledger.created_at <= now() - interval '2 minutes'
  group by ledger.id
  order by ledger.created_at desc
  limit 1000
`

const PROBLEM_ATTEMPTS_QUERY = `
  select
    id::text as attempt_id,
    event_id,
    event_name,
    provider,
    case
      when status = 'dead_lettered' then 'dead_lettered'
      else 'initial_pending_over_two_minutes'
    end as issue_code
  from ops.provider_dispatch_attempts
  where (
    status = 'pending'
    and attempt_count = 0
    and created_at >= now() - interval '1 hour'
    and created_at <= now() - interval '2 minutes'
  ) or (
    status = 'dead_lettered'
    and updated_at >= now() - interval '20 minutes'
  )
  order by updated_at desc
  limit 100
`

const ACK_LATENCY_QUERY = `
  select
    count(*)::integer as sample_size,
    percentile_cont(0.95) within group (
      order by greatest(
        0,
        extract(epoch from (processed_at - created_at)) * 1000
      )
    ) as p95_ack_latency_ms
  from ops.provider_dispatch_attempts
  where status = 'accepted_unverified'
    and processed_at >= now() - interval '1 hour'
`

const META_ACCEPTANCE_QUERY = `
  select
    count(*)::integer as eligible_sample_size,
    count(*) filter (
      where attempt.status = 'accepted_unverified'
    )::integer as accepted_unverified_count
  from ops.provider_dispatch_attempts as attempt
  inner join marketing.event_ledger as ledger
    on ledger.event_id = attempt.event_id
    and ledger.event_name = attempt.event_name
  where attempt.provider = 'meta'
    and attempt.dispatch_mode in ('server_direct', 'server_retry')
    and attempt.status <> 'skipped_unqualified'
    and ledger.payload ->> 'environment' = 'production'
    and attempt.created_at >= now() - interval '1 hour'
    and attempt.created_at <= now() - interval '2 minutes'
`

const META_CLICK_ID_COVERAGE_QUERY = `
  select
    count(*) filter (
      where nullif(payload #>> '{click_id,fbclid}', '') is not null
    )::integer as fbclid_page_view_count,
    count(*) filter (
      where nullif(payload #>> '{click_id,fbclid}', '') is not null
        and nullif(payload #>> '{browser_id,fbc}', '') is not null
    )::integer as fbc_and_fbclid_page_view_count
  from marketing.event_ledger
  where event_name = 'page_view'
    and payload ->> 'environment' = 'production'
    and payload #>> '{consent,marketing}' = 'granted'
    and occurred_at >= now() - interval '24 hours'
`

const META_EDGE_CLICK_ID_COVERAGE_QUERY = `
  select
    count(*)::integer as meta_landing_count,
    count(*) filter (where observation.fbclid_present)::integer
      as meta_landing_with_fbclid_count
  from ops.meta_landing_observability as observation
  where observation.is_primary_request_observation
    and observation.environment = 'production'
    and observation.observation_type = 'document'
    and observation.automation_class = 'human_or_unknown'
    and coalesce(
      observation.traffic_classification,
      'human_or_unknown'
    ) = 'human_or_unknown'
    and observation.observed_at >= now() - interval '24 hours'
    and (
      observation.fbclid_present
      or observation.meta_ad_id is not null
      or lower(coalesce(observation.utm_source, '')) in (
        'facebook',
        'instagram',
        'meta',
        'fb',
        'ig'
      )
    )
`

const META_CLICK_TO_EDGE_QUERY = `
  with account_context as (
    select account_id, account_timezone
    from marketing.meta_ad_delivery_insights
    where breakdown_kind = 'overall'
    order by insight_date desc, fetched_at desc
    limit 1
  ),
  daily_clicks as (
    select
      insight_date,
      sum(outbound_clicks)::numeric as outbound_clicks
    from marketing.meta_ad_delivery_insights as insight
    where breakdown_kind = 'overall'
      and metric_availability ->> 'outbound_clicks' = 'available'
      and insight_date >= current_date - 15
      and insight.account_id = (
        select account_id from account_context
      )
    group by insight_date
  ),
  daily_edges as (
    select
      (observation.observed_at at time zone account.account_timezone)::date
        as insight_date,
      count(*) filter (
        where observation.is_first_fbclid_observation
      )::numeric as click_id_edge_documents,
      count(*) filter (
        where observation.is_primary_request_observation
          and not observation.fbclid_present
      )::numeric as signal_without_click_id_edge_documents,
      count(*) filter (
        where observation.status_code between 200 and 399
      )::numeric as successful_edge_documents
    from ops.meta_landing_observability as observation
    cross join account_context as account
    where observation.observed_at >= now() - interval '16 days'
      and observation.environment = 'production'
      and observation.observation_type = 'document'
      and observation.automation_class = 'human_or_unknown'
      and coalesce(
        observation.traffic_classification,
        'human_or_unknown'
      ) = 'human_or_unknown'
      and (
        observation.is_first_fbclid_observation
        or (
          observation.is_primary_request_observation
          and not observation.fbclid_present
          and (
            observation.meta_ad_id is not null
            or lower(coalesce(observation.utm_source, '')) in (
              'facebook',
              'instagram',
              'meta',
              'fb',
              'ig'
            )
          )
        )
      )
    group by 1
  ),
  daily_rates as (
    select
      clicks.insight_date,
      clicks.outbound_clicks,
      coalesce(edges.click_id_edge_documents, 0)
        as click_id_edge_documents,
      coalesce(edges.signal_without_click_id_edge_documents, 0)
        as signal_without_click_id_edge_documents,
      coalesce(edges.successful_edge_documents, 0)
        as successful_edge_documents,
      coalesce(edges.click_id_edge_documents, 0)
        + coalesce(edges.signal_without_click_id_edge_documents, 0)
        as edge_documents,
      case
        when clicks.outbound_clicks > 0
          then (
            coalesce(edges.click_id_edge_documents, 0)
            + coalesce(edges.signal_without_click_id_edge_documents, 0)
          ) / clicks.outbound_clicks
        else null
      end as click_to_edge_rate
    from daily_clicks as clicks
    left join daily_edges as edges using (insight_date)
  ),
  current_day as (
    select *
    from daily_rates
    where edge_documents > 0
    order by insight_date desc
    limit 1
  ),
  baseline as (
    select
      count(*) filter (
        where outbound_clicks >= 50 and edge_documents > 0
      )::integer
        as baseline_day_count,
      avg(click_to_edge_rate) filter (
        where outbound_clicks >= 50 and edge_documents > 0
      )
        as baseline_rate
    from daily_rates
    where insight_date < (select insight_date from current_day)
  )
  select
    current_day.insight_date::text as current_date,
    current_day.outbound_clicks as current_outbound_clicks,
    current_day.edge_documents as current_edge_count,
    current_day.click_id_edge_documents as current_click_id_edge_count,
    current_day.signal_without_click_id_edge_documents
      as current_signal_without_click_id_edge_count,
    current_day.successful_edge_documents
      as current_successful_edge_count,
    baseline.baseline_day_count,
    baseline.baseline_rate
  from current_day
  cross join baseline
`

function text(value: unknown, field: string) {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Invalid provider health ${field}`)
  }
  return value
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value ? value : null
}

function number(value: unknown, field: string) {
  const parsed =
    typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid provider health ${field}`)
  }
  return parsed
}

function nullableNumber(value: unknown, field: string) {
  return value === null || value === undefined ?
      null
    : number(value, field)
}

function parseProviders(value: unknown) {
  const parsed =
    typeof value === 'string' ? JSON.parse(value) : value

  if (
    !Array.isArray(parsed) ||
    parsed.some(provider => typeof provider !== 'string')
  ) {
    throw new Error('Invalid provider health providers')
  }

  return parsed as string[]
}

function parseLedgerCandidate(
  row: QueryRow
): ProviderDispatchHealthLedgerCandidate {
  return {
    eventId: text(row.event_id, 'event_id'),
    eventName: text(row.event_name, 'event_name'),
    payload: row.payload,
    providers: parseProviders(row.providers)
  }
}

function parseProblemAttempt(
  row: QueryRow
): ProviderDispatchHealthProblemAttempt {
  const issueCode = text(row.issue_code, 'issue_code')
  if (
    issueCode !== 'dead_lettered' &&
    issueCode !== 'initial_pending_over_two_minutes'
  ) {
    throw new Error('Invalid provider health issue_code')
  }

  return {
    attemptId: text(row.attempt_id, 'attempt_id'),
    eventId: nullableText(row.event_id),
    eventName: nullableText(row.event_name),
    issueCode,
    provider: text(row.provider, 'provider')
  }
}

export function createPostgresProviderDispatchHealthStore(
  executeQuery: ProviderDispatchHealthQueryExecutor = executePostgresQuery
): ProviderDispatchHealthStore {
  return {
    readSnapshot:
      async (): Promise<ProviderDispatchHealthSnapshot> => {
        const ledgerRows = await executeQuery(
          LEDGER_CANDIDATES_QUERY,
          []
        )
        const problemRows = await executeQuery(
          PROBLEM_ATTEMPTS_QUERY,
          []
        )
        const latencyRows = await executeQuery(
          ACK_LATENCY_QUERY,
          []
        )
        const metaAcceptanceRows = await executeQuery(
          META_ACCEPTANCE_QUERY,
          []
        )
        const metaClickIdCoverageRows = await executeQuery(
          META_CLICK_ID_COVERAGE_QUERY,
          []
        )
        const metaEdgeClickIdCoverageRows = await executeQuery(
          META_EDGE_CLICK_ID_COVERAGE_QUERY,
          []
        )
        const metaClickToEdgeRows = await executeQuery(
          META_CLICK_TO_EDGE_QUERY,
          []
        )
        const latency = latencyRows[0]
        const metaAcceptance = metaAcceptanceRows[0]
        const metaClickIdCoverage = metaClickIdCoverageRows[0]
        const metaEdgeClickIdCoverage =
          metaEdgeClickIdCoverageRows[0]
        const metaClickToEdge = metaClickToEdgeRows[0]
        const sampleSize = number(
          latency?.sample_size ?? 0,
          'sample_size'
        )
        const p95Raw = latency?.p95_ack_latency_ms

        return {
          ackSampleSize: sampleSize,
          clickToEdgeBaselineDayCount: number(
            metaClickToEdge?.baseline_day_count ?? 0,
            'click_to_edge_baseline_day_count'
          ),
          clickToEdgeBaselineRate: nullableNumber(
            metaClickToEdge?.baseline_rate,
            'click_to_edge_baseline_rate'
          ),
          clickToEdgeCurrentDate: nullableText(
            metaClickToEdge?.current_date
          ),
          clickToEdgeCurrentEdgeCount: number(
            metaClickToEdge?.current_edge_count ?? 0,
            'click_to_edge_current_edge_count'
          ),
          clickToEdgeCurrentClickIdCount: number(
            metaClickToEdge?.current_click_id_edge_count ?? 0,
            'click_to_edge_current_click_id_edge_count'
          ),
          clickToEdgeCurrentSignalWithoutClickIdCount: number(
            metaClickToEdge?.current_signal_without_click_id_edge_count ??
              0,
            'click_to_edge_current_signal_without_click_id_edge_count'
          ),
          clickToEdgeCurrentSuccessfulEdgeCount: number(
            metaClickToEdge?.current_successful_edge_count ?? 0,
            'click_to_edge_current_successful_edge_count'
          ),
          clickToEdgeCurrentOutboundClicks: number(
            metaClickToEdge?.current_outbound_clicks ?? 0,
            'click_to_edge_current_outbound_clicks'
          ),
          edgeMetaLandingCount: number(
            metaEdgeClickIdCoverage?.meta_landing_count ?? 0,
            'edge_meta_landing_count'
          ),
          edgeMetaLandingWithFbclidCount: number(
            metaEdgeClickIdCoverage?.meta_landing_with_fbclid_count ??
              0,
            'edge_meta_landing_with_fbclid_count'
          ),
          fbcAndFbclidPageViewCount: number(
            metaClickIdCoverage?.fbc_and_fbclid_page_view_count ??
              0,
            'fbc_and_fbclid_page_view_count'
          ),
          fbclidPageViewCount: number(
            metaClickIdCoverage?.fbclid_page_view_count ?? 0,
            'fbclid_page_view_count'
          ),
          ledgerCandidates: ledgerRows.map(parseLedgerCandidate),
          metaAcceptedUnverifiedCount: number(
            metaAcceptance?.accepted_unverified_count ?? 0,
            'meta_accepted_unverified_count'
          ),
          metaEligibleSampleSize: number(
            metaAcceptance?.eligible_sample_size ?? 0,
            'meta_eligible_sample_size'
          ),
          p95AckLatencyMs:
            p95Raw === null || p95Raw === undefined ?
              null
            : number(p95Raw, 'p95_ack_latency_ms'),
          problemAttempts: problemRows.map(parseProblemAttempt)
        }
      }
  }
}

export const postgresProviderDispatchHealthStore =
  createPostgresProviderDispatchHealthStore()
