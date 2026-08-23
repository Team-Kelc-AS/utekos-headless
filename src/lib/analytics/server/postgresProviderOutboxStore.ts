import postgres from 'postgres'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import type { CanonicalEvent } from '../canonicalEvent'
import type { ProviderAdapter } from './providerAdapter'
import type {
  ProviderOutboxDatabase,
  RawProviderOutboxAttempt
} from './providerOutboxTypes'

type QueryRow = Record<string, unknown>

export type ProviderOutboxQueryExecutor = <
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

const executePostgresQuery: ProviderOutboxQueryExecutor =
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

const CLAIM_NEXT_QUERY = `
  with candidate as (
    select id
    from ops.provider_dispatch_attempts
    where provider = $1
      and event_name = $2
      and dispatch_mode = 'server_retry'
      and (
        $3::timestamptz is null
        or created_at >= $3::timestamptz
      )
      and (
        (
          status in ('pending', 'retry_scheduled')
          and (
            next_attempt_at is null
            or next_attempt_at <= now()
          )
        )
        or (
          status = 'processing'
          and coalesce(last_attempt_started_at, updated_at)
            <= now() - interval '5 minutes'
        )
      )
    order by
      case when status = 'processing' then 0 else 1 end,
      coalesce(next_attempt_at, created_at),
      created_at
    for update skip locked
    limit 1
  )
  update ops.provider_dispatch_attempts as attempt
  set
    status = 'processing',
    attempt_count = attempt.attempt_count + 1,
    next_attempt_at = null,
    last_attempt_started_at = now(),
    updated_at = now()
  from candidate
  where attempt.id = candidate.id
  returning
    attempt.id::text as attempt_id,
    attempt.attempt_count,
    attempt.payload
`

const CLAIM_BY_ID_QUERY = `
  with candidate as (
    select id
    from ops.provider_dispatch_attempts
    where id = $1::uuid
      and provider = $2
      and event_name = $3
      and dispatch_mode = 'server_retry'
      and (
        $4::timestamptz is null
        or created_at >= $4::timestamptz
      )
      and (
        (
          status in ('pending', 'retry_scheduled')
          and (
            next_attempt_at is null
            or next_attempt_at <= now()
          )
        )
        or (
          status = 'processing'
          and coalesce(last_attempt_started_at, updated_at)
            <= now() - interval '15 seconds'
        )
      )
    for update skip locked
  )
  update ops.provider_dispatch_attempts as attempt
  set
    status = 'processing',
    attempt_count = attempt.attempt_count + 1,
    next_attempt_at = null,
    last_attempt_started_at = now(),
    updated_at = now()
  from candidate
  where attempt.id = candidate.id
  returning
    attempt.id::text as attempt_id,
    attempt.attempt_count,
    attempt.payload
`

const ACCEPTED_UNVERIFIED_QUERY = `
  update ops.provider_dispatch_attempts
  set
    status = 'accepted_unverified',
    response = $2::jsonb,
    request_id = $3,
    validation_result = $4::jsonb,
    response_semantics = 'provider_accepted_unverified',
    http_status = $5,
    last_error = null,
    next_attempt_at = null,
    latency_ms = $6,
    processed_at = now(),
    updated_at = now()
  where id = $1::uuid
    and status = 'processing'
    and attempt_count = $7
  returning id::text as id
`

const RETRY_SCHEDULED_QUERY = `
  update ops.provider_dispatch_attempts
  set
    status = 'retry_scheduled',
    next_attempt_at = $2::timestamptz,
    last_error = $3,
    latency_ms = $4,
    response_semantics = 'transient_failure_retry_scheduled',
    processed_at = null,
    updated_at = now()
  where id = $1::uuid
    and status = 'processing'
    and attempt_count = $5
  returning id::text as id
`

const DEAD_LETTER_QUERY = `
  with completed as (
    update ops.provider_dispatch_attempts
    set
      status = 'dead_lettered',
      next_attempt_at = null,
      last_error = $2,
      latency_ms = $3,
      response_semantics = 'terminal_failure',
      processed_at = now(),
      updated_at = now()
    where id = $1::uuid
      and status = 'processing'
      and attempt_count = $6
    returning id, event_id, event_name
  )
  insert into ops.dead_letter_events (
    source,
    reason,
    payload,
    metadata
  )
  select
    $5::text,
    $4::text,
    jsonb_build_object('provider_dispatch_attempt_id', id),
    jsonb_build_object(
      'event_id', event_id,
      'event_name', event_name,
      'provider', $5::text
    )
  from completed
  returning id::text as id
`

const INVALID_PAYLOAD_QUERY = `
  with completed as (
    update ops.provider_dispatch_attempts
    set
      status = 'dead_lettered',
      next_attempt_at = null,
      last_error = $2,
      latency_ms = 0,
      response_semantics = 'invalid_payload',
      processed_at = now(),
      updated_at = now()
    where id = $1::uuid
      and status = 'processing'
      and attempt_count = $5
    returning id, event_id, event_name
  )
  insert into ops.dead_letter_events (
    source,
    reason,
    payload,
    metadata
  )
  select
    $3::text,
    $4::text,
    jsonb_build_object('provider_dispatch_attempt_id', id),
    jsonb_build_object(
      'event_id', event_id,
      'event_name', event_name,
      'provider', $3::text
    )
  from completed
  returning id::text as id
`

function assertCompleted(
  rows: QueryRow[],
  adapterKey: string,
  attemptId: string
) {
  if (rows.length !== 1) {
    throw new Error(
      `${adapterKey} outbox attempt ${attemptId} is no longer processing`
    )
  }
}

function parseClaimedRow(
  row: QueryRow | undefined
): RawProviderOutboxAttempt | null {
  if (!row) return null

  const attemptId = row.attempt_id
  const attemptCount = row.attempt_count

  if (
    typeof attemptId !== 'string' ||
    typeof attemptCount !== 'number'
  ) {
    throw new Error('Invalid provider outbox claim result')
  }

  return { attemptCount, attemptId, payload: row.payload }
}

export function createPostgresProviderOutboxDatabase<
  E extends CanonicalEvent,
  R
>(
  adapter: ProviderAdapter<E, R>,
  executeQuery: ProviderOutboxQueryExecutor = executePostgresQuery
): ProviderOutboxDatabase<R> {
  return {
    claimById: async attemptId =>
      startAnalyticsSpan(
        {
          name: 'db.query provider_outbox.claim_by_id',
          op: 'db.query',
          attributes: {
            'db.system': 'postgresql',
            'db.operation.name': 'claim_by_id',
            'db.namespace': 'ops'
          }
        },
        async () => {
          const rows = await executeQuery(CLAIM_BY_ID_QUERY, [
            attemptId,
            adapter.provider,
            adapter.eventName,
            adapter.claimNotBefore ?? null
          ])

          return parseClaimedRow(rows[0])
        }
      ),
    claimNext: async () =>
      startAnalyticsSpan(
        {
          name: 'db.query provider_outbox.claim_next',
          op: 'db.query',
          attributes: {
            'db.system': 'postgresql',
            'db.operation.name': 'claim_next',
            'db.namespace': 'ops'
          }
        },
        async () => {
          const rows = await executeQuery(CLAIM_NEXT_QUERY, [
            adapter.provider,
            adapter.eventName,
            adapter.claimNotBefore ?? null
          ])

          return parseClaimedRow(rows[0])
        }
      ),
    markAcceptedUnverified: async outcome => {
      const receipt = adapter.projectReceipt(outcome.receipt)
      const rows = await executeQuery(ACCEPTED_UNVERIFIED_QUERY, [
        outcome.attemptId,
        receipt.response,
        receipt.requestId,
        receipt.validationResult,
        receipt.httpStatus ?? null,
        outcome.latencyMs,
        outcome.attemptCount
      ])

      assertCompleted(rows, adapter.key, outcome.attemptId)
    },
    markRetryScheduled: async outcome => {
      const rows = await executeQuery(RETRY_SCHEDULED_QUERY, [
        outcome.attemptId,
        outcome.nextAttemptAt,
        outcome.errorMessage,
        outcome.latencyMs,
        outcome.attemptCount
      ])

      assertCompleted(rows, adapter.key, outcome.attemptId)
    },
    markDeadLettered: async outcome => {
      const reason =
        outcome.reason === 'attempts_exhausted' ?
          adapter.deadLetterReasons.attemptsExhausted
        : adapter.deadLetterReasons.permanentError
      const rows = await executeQuery(DEAD_LETTER_QUERY, [
        outcome.attemptId,
        outcome.errorMessage,
        outcome.latencyMs,
        reason,
        adapter.provider,
        outcome.attemptCount
      ])

      assertCompleted(rows, adapter.key, outcome.attemptId)
    },
    markInvalidPayload: async failure => {
      const rows = await executeQuery(INVALID_PAYLOAD_QUERY, [
        failure.attemptId,
        failure.errorMessage,
        adapter.provider,
        adapter.deadLetterReasons.invalidPayload,
        failure.attemptCount
      ])

      assertCompleted(rows, adapter.key, failure.attemptId)
    }
  }
}
