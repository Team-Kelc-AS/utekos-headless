import 'server-only'
import postgres from 'postgres'
import { parseCanonicalEvent } from '../canonicalEvent'
import {
  createCanonicalEventStore,
  type CanonicalEventTransactionRunner
} from './createCanonicalEventStore'
import { publishCanonicalProviderDispatchAttempts } from './canonicalProviderDispatchQueue'
import type {
  CanonicalEventLookup,
  CanonicalEventStore
} from './canonicalEventStore'

let trackingSql: ReturnType<typeof postgres> | undefined

function getTrackingSql() {
  const connectionString =
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
    max_lifetime: 60 * 30
  })

  return trackingSql
}

const runPostgresTransaction: CanonicalEventTransactionRunner =
  work =>
    getTrackingSql().begin(async sql =>
      work({
        insertLedger: async row => {
          const inserted = await sql`
            insert into marketing.event_ledger (
              event_id,
              event_name,
              idempotency_key,
              external_id,
              source_url,
              consent,
              user_data_quality,
              payload,
              occurred_at
            ) values (
              ${row.event_id},
              ${row.event_name},
              ${row.idempotency_key},
              ${row.external_id ?? null},
              ${row.source_url ?? null},
              ${sql.json(row.consent)},
              ${sql.json(row.user_data_quality)},
              ${sql.json(row.payload as postgres.JSONValue)},
              ${row.occurred_at}
            )
            on conflict (idempotency_key) do nothing
            returning id
          `

          return inserted.length === 1
        },
        upsertSourceEvidence: async row => {
          const upserted = await sql`
            insert into marketing.canonical_event_source_evidence (
              canonical_event_id,
              canonical_event_name,
              canonical_idempotency_key,
              observation_key,
              source_system,
              source_method,
              source_object_type,
              source_object_id,
              source_topic,
              source_delivery_id,
              source_event_id,
              source_api_version,
              source_triggered_at,
              source_observed_at
            ) values (
              ${row.canonical_event_id},
              ${row.canonical_event_name},
              ${row.canonical_idempotency_key},
              ${row.observation_key},
              ${row.source_system},
              ${row.source_method},
              ${row.source_object_type},
              ${row.source_object_id},
              ${row.source_topic},
              ${row.source_delivery_id},
              ${row.source_event_id},
              ${row.source_api_version},
              ${row.source_triggered_at},
              ${row.source_observed_at}
            )
            on conflict (observation_key) do update
            set
              source_observed_at = greatest(
                marketing.canonical_event_source_evidence.source_observed_at,
                excluded.source_observed_at
              ),
              observation_count =
                marketing.canonical_event_source_evidence.observation_count + 1,
              updated_at = now()
            where
              marketing.canonical_event_source_evidence.canonical_event_id = excluded.canonical_event_id
              and marketing.canonical_event_source_evidence.canonical_event_name = excluded.canonical_event_name
              and marketing.canonical_event_source_evidence.canonical_idempotency_key = excluded.canonical_idempotency_key
              and marketing.canonical_event_source_evidence.source_system = excluded.source_system
              and marketing.canonical_event_source_evidence.source_method = excluded.source_method
              and marketing.canonical_event_source_evidence.source_object_type = excluded.source_object_type
              and marketing.canonical_event_source_evidence.source_object_id = excluded.source_object_id
              and marketing.canonical_event_source_evidence.source_topic = excluded.source_topic
              and marketing.canonical_event_source_evidence.source_delivery_id is not distinct from excluded.source_delivery_id
              and marketing.canonical_event_source_evidence.source_event_id is not distinct from excluded.source_event_id
              and marketing.canonical_event_source_evidence.source_api_version = excluded.source_api_version
              and marketing.canonical_event_source_evidence.source_triggered_at = excluded.source_triggered_at
            returning id
          `

          if (upserted.length !== 1) {
            throw new Error('source_evidence_conflict')
          }
        },
        insertDispatch: async row => {
          const inserted = await sql`
            insert into ops.provider_dispatch_attempts (
              idempotency_key,
              provider,
              event_id,
              event_name,
              status,
              next_attempt_at,
              payload,
              consent_basis,
              data_quality,
              dispatch_mode,
              skip_reason,
              processed_at,
              response_semantics
            ) values (
              ${row.idempotency_key},
              ${row.provider},
              ${row.event_id},
              ${row.event_name},
              ${row.status},
              case when ${row.status} = 'pending' then now() end,
              ${sql.json(row.payload as postgres.JSONValue)},
              ${sql.json(row.consent_basis)},
              ${sql.json(row.data_quality)},
              ${row.dispatch_mode},
              ${row.skip_reason ?? null},
              case
                when ${row.status} = 'skipped_unqualified'
                  then now()
              end,
              case
                when ${row.status} = 'skipped_unqualified'
                  then 'skipped_unqualified'
              end
            )
            on conflict (provider, idempotency_key) do nothing
            returning id::text as attempt_id
          `

          const attemptId = inserted[0]?.attempt_id

          if (attemptId === undefined) return null
          if (typeof attemptId !== 'string') {
            throw new Error('invalid_provider_attempt_id')
          }

          return attemptId
        }
      })
    )

async function findCanonicalEvent(input: CanonicalEventLookup) {
  const rows = await getTrackingSql()`
    select payload
    from marketing.event_ledger
    where event_id = ${input.event_id}
      and event_name = ${input.event_name}
    limit 2
  `

  if (rows.length === 0) return null
  if (rows.length !== 1) {
    throw new Error('canonical_event_lookup_not_unique')
  }

  const event = parseCanonicalEvent(rows[0]?.payload)

  if (
    event.event_id !== input.event_id ||
    event.event_name !== input.event_name
  ) {
    throw new Error('canonical_event_lookup_mismatch')
  }

  return event
}

const transactionalCanonicalEventStore =
  createCanonicalEventStore(runPostgresTransaction)

export const postgresCanonicalEventStore: CanonicalEventStore = {
  accept: async input => {
    const result = await transactionalCanonicalEventStore.accept(input)

    await publishCanonicalProviderDispatchAttempts(
      result.createdDispatchAttempts
    )

    return result
  },
  find: findCanonicalEvent
}

export const postgresCanonicalPageViewStore =
  postgresCanonicalEventStore
