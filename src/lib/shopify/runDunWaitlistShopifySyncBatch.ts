import 'server-only'

import postgres from 'postgres'
import { z } from 'zod'

import {
  syncDunWaitlistCustomerToShopify,
  type DunWaitlistCustomer
} from './syncDunWaitlistCustomerToShopify'

type QueryRow = Record<string, unknown>

export type DunWaitlistSyncQueryExecutor = <
  T extends QueryRow
>(
  query: string,
  parameters: readonly unknown[]
) => Promise<T[]>

export type DunWaitlistShopifySyncSummary = {
  claimed: number
  deadLettered: number
  enqueued: number
  limitReached: boolean
  retryScheduled: number
  succeeded: number
}

export type RunDunWaitlistShopifySyncBatchDependencies = {
  executeQuery: DunWaitlistSyncQueryExecutor
  now: () => Date
  syncCustomer: (
    input: DunWaitlistCustomer
  ) => Promise<{ customerId: string }>
}

const PROVIDER = 'shopify'
const EVENT_TYPE = 'dun_waitlist_customer_sync'
const MAX_ATTEMPTS = 5
const STALE_PROCESSING_AFTER = '5 minutes'

const ENQUEUE_LOCK_NAMESPACE = 20260807
const ENQUEUE_LOCK_KEY = 1

const claimedJobSchema = z.strictObject({
  attempt_count: z.number().int().positive(),
  id: z.string().uuid(),
  lead_id: z.string().uuid()
})

const leadRowSchema = z.strictObject({
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  phone: z.string().nullable()
})

const maxItemsSchema = z.number().int().min(1).max(50)

const providerFailureReasonSchema = z.enum([
  'invalid_waitlist_customer',
  'shopify_customer_lookup_failed',
  'shopify_customer_lookup_invalid_response',
  'shopify_customer_create_failed',
  'shopify_customer_create_invalid_response',
  'shopify_customer_create_rejected',
  'shopify_tags_add_failed',
  'shopify_tags_add_invalid_response',
  'shopify_tags_add_rejected'
])

const permanentFailureReasons = new Set<string>([
  'invalid_waitlist_customer',
  'shopify_customer_lookup_invalid_response',
  'shopify_customer_create_invalid_response',
  'shopify_customer_create_rejected',
  'shopify_tags_add_invalid_response',
  'shopify_tags_add_rejected'
])

let trackingSql:
  | ReturnType<typeof postgres>
  | undefined

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

const executePostgresQuery: DunWaitlistSyncQueryExecutor =
  async <T extends QueryRow>(
    query: string,
    parameters: readonly unknown[]
  ) => {
    const sql = getTrackingSql()
    const postgresParameters =
      parameters as Parameters<typeof sql.unsafe>[1]

    return sql.unsafe<T[]>(
      query,
      postgresParameters
    )
  }

const defaultDependencies: RunDunWaitlistShopifySyncBatchDependencies =
  {
    executeQuery: executePostgresQuery,
    now: () => new Date(),
    syncCustomer: syncDunWaitlistCustomerToShopify
  }

const ENQUEUE_MISSING_QUERY = `
  with sync_lock as materialized (
    select pg_try_advisory_xact_lock(
      $1::integer,
      $2::integer
    ) as acquired
  )
  insert into ops.integration_events (
    provider,
    event_type,
    status,
    payload
  )
  select
    $3,
    $4,
    'pending',
    jsonb_build_object(
      'lead_id', lead.id,
      'attempt_count', 0
    )
  from sync_lock
  cross join marketing.leads as lead
  where sync_lock.acquired
    and lead.source = 'product_waitlist_utekos_dun'
    and lead.email is not null
    and btrim(lead.email) <> ''
    and not exists (
      select 1
      from ops.integration_events as existing
      where existing.provider = $3
        and existing.event_type = $4
        and existing.payload ->> 'lead_id' = lead.id::text
    )
  order by lead.created_at, lead.id
  returning id::text as id
`

const CLAIM_NEXT_QUERY = `
  with candidate as (
    select id
    from ops.integration_events
    where provider = $1
      and event_type = $2
      and (
        status = 'pending'
        or (
          status = 'retry_scheduled'
          and (
            payload ->> 'next_attempt_at' is null
            or (
              payload ->> 'next_attempt_at'
            )::timestamptz <= now()
          )
        )
        or (
          status = 'processing'
          and coalesce(
            (
              payload ->> 'last_attempt_started_at'
            )::timestamptz,
            created_at
          ) <= now() - $3::interval
        )
      )
    order by
      case
        when status = 'processing' then 0
        else 1
      end,
      case
        when status = 'retry_scheduled'
          then (
            payload ->> 'next_attempt_at'
          )::timestamptz
        else created_at
      end,
      created_at
    for update skip locked
    limit 1
  )
  update ops.integration_events as integration_event
  set
    status = 'processing',
    payload = jsonb_set(
      jsonb_set(
        integration_event.payload - 'next_attempt_at',
        '{attempt_count}',
        to_jsonb(
          coalesce(
            (
              integration_event.payload
                ->> 'attempt_count'
            )::integer,
            0
          ) + 1
        ),
        true
      ),
      '{last_attempt_started_at}',
      to_jsonb(now()::text),
      true
    )
  from candidate
  where integration_event.id = candidate.id
  returning
    integration_event.id::text as id,
    (
      integration_event.payload
        ->> 'attempt_count'
    )::integer as attempt_count,
    integration_event.payload
      ->> 'lead_id' as lead_id
`

const LOAD_LEAD_QUERY = `
  select
    email,
    first_name,
    phone
  from marketing.leads
  where id = $1::uuid
    and source = 'product_waitlist_utekos_dun'
  limit 1
`

const MARK_SUCCEEDED_QUERY = `
  update ops.integration_events
  set
    status = 'succeeded',
    error_message = null,
    payload = jsonb_set(
      payload - 'next_attempt_at',
      '{synced_at}',
      to_jsonb(now()::text),
      true
    ),
    processed_at = now()
  where id = $1::uuid
    and status = 'processing'
    and (
      payload ->> 'attempt_count'
    )::integer = $2
  returning id::text as id
`

const MARK_RETRY_QUERY = `
  update ops.integration_events
  set
    status = 'retry_scheduled',
    error_message = $3,
    payload = jsonb_set(
      payload,
      '{next_attempt_at}',
      to_jsonb($4::text),
      true
    ),
    processed_at = null
  where id = $1::uuid
    and status = 'processing'
    and (
      payload ->> 'attempt_count'
    )::integer = $2
  returning id::text as id
`

const MARK_DEAD_LETTERED_QUERY = `
  with completed as (
    update ops.integration_events
    set
      status = 'dead_lettered',
      error_message = $3,
      payload = payload - 'next_attempt_at',
      processed_at = now()
    where id = $1::uuid
      and status = 'processing'
      and (
        payload ->> 'attempt_count'
      )::integer = $2
    returning id, event_type
  )
  insert into ops.dead_letter_events (
    source,
    reason,
    payload,
    metadata
  )
  select
    'shopify_dun_waitlist_sync',
    $3,
    jsonb_build_object(
      'integration_event_id',
      id
    ),
    jsonb_build_object(
      'event_type',
      event_type
    )
  from completed
  returning id::text as id
`

function failureReason(error: unknown): string {
  const message =
    error instanceof Error ? error.message : ''

  const parsed =
    providerFailureReasonSchema.safeParse(message)

  return parsed.success ?
      parsed.data
    : 'unexpected_error'
}

function retryDelayMinutes(
  attemptCount: number
): number {
  return Math.min(
    60,
    5 * 2 ** Math.max(0, attemptCount - 1)
  )
}

function ensureSingleUpdate(
  rows: QueryRow[],
  operation: string
): void {
  if (rows.length !== 1) {
    throw new Error(
      `integration_event_${operation}_state_conflict`
    )
  }
}

export async function runDunWaitlistShopifySyncBatch(
  input: { maxItems: number },
  dependencies: RunDunWaitlistShopifySyncBatchDependencies =
    defaultDependencies
): Promise<DunWaitlistShopifySyncSummary> {
  const maxItems =
    maxItemsSchema.parse(input.maxItems)

  const enqueuedRows =
    await dependencies.executeQuery<QueryRow>(
      ENQUEUE_MISSING_QUERY,
      [
        ENQUEUE_LOCK_NAMESPACE,
        ENQUEUE_LOCK_KEY,
        PROVIDER,
        EVENT_TYPE
      ]
    )

  const summary: DunWaitlistShopifySyncSummary = {
    claimed: 0,
    deadLettered: 0,
    enqueued: enqueuedRows.length,
    limitReached: false,
    retryScheduled: 0,
    succeeded: 0
  }

  for (
    let index = 0;
    index < maxItems;
    index += 1
  ) {
    const claimedRows =
      await dependencies.executeQuery<QueryRow>(
        CLAIM_NEXT_QUERY,
        [
          PROVIDER,
          EVENT_TYPE,
          STALE_PROCESSING_AFTER
        ]
      )

    if (claimedRows.length === 0) {
      return summary
    }

    const claimed =
      claimedJobSchema.parse(claimedRows[0])

    summary.claimed += 1

    const leadRows =
      await dependencies.executeQuery<QueryRow>(
        LOAD_LEAD_QUERY,
        [claimed.lead_id]
      )

    if (leadRows.length !== 1) {
      const updated =
        await dependencies.executeQuery<QueryRow>(
          MARK_DEAD_LETTERED_QUERY,
          [
            claimed.id,
            claimed.attempt_count,
            'lead_not_found'
          ]
        )

      ensureSingleUpdate(
        updated,
        'dead_letter'
      )

      summary.deadLettered += 1
      continue
    }

    const lead =
      leadRowSchema.safeParse(leadRows[0])

    if (!lead.success || !lead.data.email) {
      const updated =
        await dependencies.executeQuery<QueryRow>(
          MARK_DEAD_LETTERED_QUERY,
          [
            claimed.id,
            claimed.attempt_count,
            'invalid_lead_record'
          ]
        )

      ensureSingleUpdate(
        updated,
        'dead_letter'
      )

      summary.deadLettered += 1
      continue
    }

    try {
      await dependencies.syncCustomer({
        email: lead.data.email,
        firstName: lead.data.first_name,
        phone: lead.data.phone
      })

      const updated =
        await dependencies.executeQuery<QueryRow>(
          MARK_SUCCEEDED_QUERY,
          [
            claimed.id,
            claimed.attempt_count
          ]
        )

      ensureSingleUpdate(
        updated,
        'success'
      )

      summary.succeeded += 1
    } catch (error: unknown) {
      const reason = failureReason(error)

      const isPermanent =
        permanentFailureReasons.has(reason)

      const attemptsExhausted =
        claimed.attempt_count >= MAX_ATTEMPTS

      if (
        isPermanent ||
        attemptsExhausted
      ) {
        const updated =
          await dependencies.executeQuery<QueryRow>(
            MARK_DEAD_LETTERED_QUERY,
            [
              claimed.id,
              claimed.attempt_count,
              reason
            ]
          )

        ensureSingleUpdate(
          updated,
          'dead_letter'
        )

        summary.deadLettered += 1
        continue
      }

      const delayMinutes =
        retryDelayMinutes(
          claimed.attempt_count
        )

      const nextAttemptAt = new Date(
        dependencies.now().getTime() +
          delayMinutes * 60_000
      ).toISOString()

      const updated =
        await dependencies.executeQuery<QueryRow>(
          MARK_RETRY_QUERY,
          [
            claimed.id,
            claimed.attempt_count,
            reason,
            nextAttemptAt
          ]
        )

      ensureSingleUpdate(
        updated,
        'retry'
      )

      summary.retryScheduled += 1
    }
  }

  summary.limitReached =
    summary.claimed === maxItems

  return summary
}