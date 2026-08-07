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

function createQueryExecutor(sql: {
  unsafe: <T extends readonly (object | undefined)[]>(
    query: string,
    parameters?: readonly unknown[] | null
  ) => Promise<T>
}): DunWaitlistShopifyQueueQueryExecutor {
  return async <T extends DunWaitlistShopifyQueueQueryRow>(
    query: string,
    parameters: readonly unknown[]
  ) => {
    return sql.unsafe<T[]>(query, parameters)
  }
}

export const executeDunWaitlistShopifyQueueQuery: DunWaitlistShopifyQueueQueryExecutor =
  async <T extends DunWaitlistShopifyQueueQueryRow>(
    query: string,
    parameters: readonly unknown[]
  ) => {
    return createQueryExecutor(getTrackingSql())<T>(query, parameters)
  }

export const withDunWaitlistShopifyQueueTransaction: DunWaitlistShopifyQueueTransactionRunner =
  async work => {
    return getTrackingSql().begin(async sql => {
      return work({
        executeQuery: createQueryExecutor(sql)
      })
    })
  }
