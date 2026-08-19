import postgres from 'postgres'
import { z } from 'zod'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import {
  providerAdapterRegistry,
  type RegisteredProviderAdapterKey
} from './providerAdapterRegistry'

type QueryRow = Record<string, unknown>

export type DueProviderAdapterKeyQueryExecutor = (
  query: string,
  parameters: readonly unknown[]
) => Promise<QueryRow[]>

const dueProviderAdapterKeyRowSchema = z
  .object({
    adapter_key: z.string().min(1)
  })
  .strict()

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

const executePostgresQuery: DueProviderAdapterKeyQueryExecutor =
  async (
    query: string,
    parameters: readonly unknown[]
  ) => {
    const sql = getTrackingSql()
    const postgresParameters = parameters as Parameters<
      typeof sql.unsafe
    >[1]

    return sql.unsafe<QueryRow[]>(query, postgresParameters)
  }

const LIST_DUE_ADAPTER_KEYS_QUERY = `
  select distinct
    provider || ':' || event_name as adapter_key
  from ops.provider_dispatch_attempts
  where dispatch_mode = 'server_retry'
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
  order by adapter_key
  limit 100
`

export async function listDueProviderOutboxAdapterKeys(
  executeQuery: DueProviderAdapterKeyQueryExecutor =
    executePostgresQuery
): Promise<RegisteredProviderAdapterKey[]> {
  return startAnalyticsSpan(
    {
      name: 'db.query provider_outbox.list_due_adapter_keys',
      op: 'db.query',
      attributes: {
        'db.system': 'postgresql',
        'db.operation.name': 'list_due_adapter_keys',
        'db.namespace': 'ops'
      }
    },
    async () => {
      const rows = await executeQuery(
        LIST_DUE_ADAPTER_KEYS_QUERY,
        []
      )
      const keys = new Set<RegisteredProviderAdapterKey>()

      for (const row of rows) {
        const parsed = dueProviderAdapterKeyRowSchema.safeParse(row)
        if (
          parsed.success &&
          parsed.data.adapter_key in providerAdapterRegistry
        ) {
          keys.add(
            parsed.data.adapter_key as RegisteredProviderAdapterKey
          )
        }
      }

      return Array.from(keys)
    }
  )
}
