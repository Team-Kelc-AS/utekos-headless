import postgres from 'postgres'
import type {
  GoogleDataManagerStatusClaim,
  GoogleDataManagerStatusOutcome,
  GoogleDataManagerStatusStore
} from './googleDataManagerStatusTypes'

type QueryRow = Record<string, unknown>

export type GoogleDataManagerStatusQueryExecutor = <
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

const executePostgresQuery: GoogleDataManagerStatusQueryExecutor =
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
    where provider = 'google'
      and status = 'accepted_unverified'
      and request_id is not null
      and request_id <> ''
      and validation_result ->> 'validate_only' = 'false'
      and coalesce(processed_at, created_at)
        > now() - interval '24 hours'
      and response_semantics not in (
        'provider_confirmed_success_with_warnings',
        'provider_status_timeout'
      )
      and not (coalesce(response, '{}'::jsonb) ? 'statusCheckLease')
      and (
        (
          response ->> 'nextStatusCheckAt' is not null
          and (response ->> 'nextStatusCheckAt')::timestamptz <= now()
        )
        or (
          response ->> 'nextStatusCheckAt' is null
          and updated_at <= now() - interval '30 minutes'
        )
      )
    order by updated_at, created_at
    for update skip locked
    limit 1
  ),
  lease as (
    select
      id,
      gen_random_uuid()::text as lease_token
    from candidate
  )
  update ops.provider_dispatch_attempts as attempt
  set
    response = jsonb_set(
      jsonb_set(
        coalesce(attempt.response, '{}'::jsonb),
        '{statusCheckAttempts}',
        to_jsonb(
          coalesce(
            (attempt.response ->> 'statusCheckAttempts')::integer,
            0
          ) + 1
        ),
        true
      ),
      '{statusCheckLease}',
      to_jsonb(lease.lease_token),
      true
    ),
    updated_at = now()
  from lease
  where attempt.id = lease.id
  returning
    attempt.id::text as attempt_id,
    attempt.request_id,
    lease.lease_token,
    (attempt.response ->> 'statusCheckAttempts')::integer
      as status_check_attempts
`

const EXPIRE_STALE_QUERY = `
  with expired as (
    update ops.provider_dispatch_attempts
    set
      response = (
        (coalesce(response, '{}'::jsonb) - 'statusCheckLease')
        - 'nextStatusCheckAt'
      ) || jsonb_build_object(
        'statusPollingExpiredAt', now()
      ),
      response_semantics = 'provider_status_timeout',
      last_error =
        'Google Data Manager status was not terminal within 24 hours',
      updated_at = now()
    where provider = 'google'
      and status = 'accepted_unverified'
      and request_id is not null
      and request_id <> ''
      and validation_result ->> 'validate_only' = 'false'
      and coalesce(processed_at, created_at)
        <= now() - interval '24 hours'
      and response_semantics not in (
        'provider_confirmed_success_with_warnings',
        'provider_status_timeout'
      )
    returning id
  )
  select count(*)::text as expired_count
  from expired
`

const NON_TERMINAL_QUERY = `
  update ops.provider_dispatch_attempts
  set
    status = $6,
    response = (
      (response - 'statusCheckLease') - 'nextStatusCheckAt'
    ) || jsonb_build_object(
      'requestStatus', $4::jsonb,
      'requestStatusCheckedAt', now()
    ) || case
      when $9::text is null then '{}'::jsonb
      else jsonb_build_object('nextStatusCheckAt', $9::text)
    end,
    validation_result =
      (validation_result - 'provider_confirmed') ||
      jsonb_build_object('provider_status', $5::text) ||
      case
        when $6::text = 'succeeded'
          then jsonb_build_object('provider_confirmed', true)
        when $7::text = 'provider_confirmed_success_with_warnings'
          then jsonb_build_object('provider_confirmed', false)
        else '{}'::jsonb
      end,
    response_semantics = $7,
    last_error = null,
    latency_ms = $8,
    processed_at = case
      when $6::text = 'succeeded'
        or $7::text = 'provider_confirmed_success_with_warnings'
        then now()
      else processed_at
    end,
    updated_at = now()
  where id = $1::uuid
    and provider = 'google'
    and status = 'accepted_unverified'
    and request_id = $2
    and response ->> 'statusCheckLease' = $3
  returning id::text as id
`

const RETRY_QUERY = `
  update ops.provider_dispatch_attempts
  set
    response = (
      (response - 'statusCheckLease') - 'nextStatusCheckAt'
    ) || jsonb_build_object(
      'requestStatusCheckError', $4::text,
      'requestStatusCheckedAt', now(),
      'nextStatusCheckAt', $6::text
    ),
    response_semantics = 'provider_status_check_retry',
    last_error = $4,
    latency_ms = $5,
    updated_at = now()
  where id = $1::uuid
    and provider = 'google'
    and status = 'accepted_unverified'
    and request_id = $2
    and response ->> 'statusCheckLease' = $3
  returning id::text as id
`

const TERMINAL_QUERY = `
  with completed as (
    update ops.provider_dispatch_attempts
    set
      status = 'dead_lettered',
      response = (response - 'statusCheckLease') || jsonb_build_object(
        'requestStatus', $4::jsonb,
        'requestStatusCheckedAt', now()
      ),
      validation_result = validation_result || jsonb_build_object(
        'provider_status', $5::text,
        'provider_confirmed', false
      ),
      response_semantics = 'provider_confirmed_failure',
      last_error = $6,
      latency_ms = $7,
      processed_at = now(),
      updated_at = now()
    where id = $1::uuid
      and provider = 'google'
      and status = 'accepted_unverified'
      and request_id = $2
      and response ->> 'statusCheckLease' = $3
    returning id, event_id, event_name, request_id
  )
  insert into ops.dead_letter_events (
    source,
    reason,
    payload,
    metadata
  )
  select
    'google',
    $8::text,
    jsonb_build_object(
      'provider_dispatch_attempt_id', id,
      'request_status', $4::jsonb
    ),
    jsonb_build_object(
      'event_id', event_id,
      'event_name', event_name,
      'provider', 'google',
      'request_id', request_id,
      'provider_status', $5::text
    )
  from completed
  returning id::text as id
`

function parseClaim(
  row: QueryRow | undefined
): GoogleDataManagerStatusClaim | null {
  if (!row) return null

  const attemptId = row.attempt_id
  const leaseToken = row.lease_token
  const requestId = row.request_id
  const statusCheckAttempts = row.status_check_attempts

  if (
    typeof attemptId !== 'string' ||
    typeof leaseToken !== 'string' ||
    typeof requestId !== 'string' ||
    typeof statusCheckAttempts !== 'number' ||
    !Number.isInteger(statusCheckAttempts) ||
    statusCheckAttempts < 1
  ) {
    throw new Error(
      'Invalid Google Data Manager status claim result'
    )
  }

  return {
    attemptId,
    leaseToken,
    requestId,
    statusCheckAttempts
  }
}

function assertCompleted(
  rows: QueryRow[],
  claim: GoogleDataManagerStatusClaim
) {
  if (rows.length !== 1) {
    throw new Error(
      `Google Data Manager status claim ${claim.attemptId} lost its lease`
    )
  }
}

function statusError(
  outcome: Exclude<
    GoogleDataManagerStatusOutcome,
    { status: 'retry' }
  >
) {
  if (outcome.status === 'processing_failure') {
    return `Google Data Manager request ${outcome.claim.requestId} returned SUCCESS with record_count=${outcome.result.recordCount ?? 'missing'}, errors=${outcome.result.errorCounts.length}`
  }

  return `Google Data Manager request ${outcome.claim.requestId} returned ${outcome.result.overallStatus}`
}

function parseExpiredCount(row: QueryRow | undefined) {
  const value = row?.expired_count
  const count = typeof value === 'string' ? Number(value) : value

  if (
    typeof count !== 'number' ||
    !Number.isSafeInteger(count) ||
    count < 0
  ) {
    throw new Error(
      'Invalid Google Data Manager expired status count'
    )
  }

  return count
}

export function createPostgresGoogleDataManagerStatusStore(
  executeQuery: GoogleDataManagerStatusQueryExecutor = executePostgresQuery
): GoogleDataManagerStatusStore {
  return {
    expireStale: async () => {
      const rows = await executeQuery(EXPIRE_STALE_QUERY, [])

      return parseExpiredCount(rows[0])
    },
    claimNext: async () => {
      const rows = await executeQuery(CLAIM_NEXT_QUERY, [])

      return parseClaim(rows[0])
    },
    complete: async outcome => {
      const claimParameters = [
        outcome.claim.attemptId,
        outcome.claim.requestId,
        outcome.claim.leaseToken
      ] as const

      if (outcome.status === 'retry') {
        const rows = await executeQuery(RETRY_QUERY, [
          ...claimParameters,
          outcome.errorMessage,
          outcome.latencyMs,
          outcome.nextCheckAt
        ])
        assertCompleted(rows, outcome.claim)
        return
      }

      const statusResponse = outcome.result.response

      if (
        outcome.status === 'failed' ||
        outcome.status === 'partial_success' ||
        outcome.status === 'processing_failure'
      ) {
        const rows = await executeQuery(TERMINAL_QUERY, [
          ...claimParameters,
          statusResponse,
          outcome.result.overallStatus,
          statusError(outcome),
          outcome.latencyMs,
          outcome.status === 'failed' ?
            'google_data_manager_request_failed'
          : outcome.status === 'partial_success' ?
            'google_data_manager_request_partial_success'
          : 'google_data_manager_request_processing_mismatch'
        ])
        assertCompleted(rows, outcome.claim)
        return
      }

      const succeeded = outcome.status === 'succeeded'
      const succeededWithWarnings =
        outcome.status === 'succeeded_with_warnings'
      const rows = await executeQuery(NON_TERMINAL_QUERY, [
        ...claimParameters,
        statusResponse,
        outcome.result.overallStatus,
        succeeded ? 'succeeded' : 'accepted_unverified',
        succeeded ? 'provider_confirmed_success'
        : succeededWithWarnings ?
          'provider_confirmed_success_with_warnings'
        : outcome.status === 'processing' ? 'provider_processing'
        : 'provider_status_unknown',
        outcome.latencyMs,
        (
          outcome.status === 'processing' ||
          outcome.status === 'unknown'
        ) ?
          outcome.nextCheckAt
        : null
      ])
      assertCompleted(rows, outcome.claim)
    }
  }
}
