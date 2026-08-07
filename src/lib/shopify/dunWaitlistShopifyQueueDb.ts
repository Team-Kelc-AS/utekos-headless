import 'server-only'

import postgres from 'postgres'

export type DunWaitlistShopifyQueueQueryRow = Record<string, unknown>

export type DunWaitlistShopifyQueueQueryExecutor = <
  T extends DunWaitlistShopifyQueueQueryRow
>(
  query: string,
  parameters: readonly unknown[]
) => Promise<T[]>

export type DunWaitlistShopifyQueueTransaction = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
}

export type DunWaitlistShopifyQueueTransactionRunner = <T>(
  work: (transaction: DunWaitlistShopifyQueueTransaction) => Promise<T>
) => Promise<T>

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

export const executeDunWaitlistShopifyQueueQuery: DunWaitlistShopifyQueueQueryExecutor =
  async <T extends DunWaitlistShopifyQueueQueryRow>(
    query: string,
    parameters: readonly unknown[]
  ) => {
    const sql = getTrackingSql()
    const postgresParameters =
      parameters as Parameters<typeof sql.unsafe>[1]

    return sql.unsafe<T[]>(query, postgresParameters)
  }

export const withDunWaitlistShopifyQueueTransaction: DunWaitlistShopifyQueueTransactionRunner =
  async <T>(
    work: (transaction: DunWaitlistShopifyQueueTransaction) => Promise<T>
  ): Promise<T> => {
    const result = await getTrackingSql().begin(async sql => {
      const executeQuery: DunWaitlistShopifyQueueQueryExecutor = async <
        TRow extends DunWaitlistShopifyQueueQueryRow
      >(
        query: string,
        parameters: readonly unknown[]
      ) => {
        const postgresParameters =
          parameters as Parameters<typeof sql.unsafe>[1]

        return sql.unsafe<TRow[]>(query, postgresParameters)
      }

      return work({ executeQuery })
    })

    return result as T
  }
