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
    throw new Error('Missing tracking database connection string')
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
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid provider health ${field}`)
  }
  return parsed
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
  executeQuery: ProviderDispatchHealthQueryExecutor =
    executePostgresQuery
): ProviderDispatchHealthStore {
  return {
    readSnapshot: async (): Promise<ProviderDispatchHealthSnapshot> => {
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
      const latency = latencyRows[0]
      const sampleSize = number(
        latency?.sample_size ?? 0,
        'sample_size'
      )
      const p95Raw = latency?.p95_ack_latency_ms

      return {
        ackSampleSize: sampleSize,
        ledgerCandidates: ledgerRows.map(parseLedgerCandidate),
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
