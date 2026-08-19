import 'server-only'
import { getPostgresClient } from '@/lib/db/getPostgresClient'
import {
  createPostgresWebVitalsStore,
  type WebVitalsQueryExecutor
} from './createPostgresWebVitalsStore'

function getTrackingSql() {
  const trackingSql = getPostgresClient()

  if (!trackingSql) {
    throw new Error('Missing tracking database connection string')
  }

  return trackingSql
}

const executePostgresWebVitalInsert: WebVitalsQueryExecutor = async (
  query,
  parameters
) => {
  const sql = getTrackingSql()
  const postgresParameters = parameters as Parameters<typeof sql.unsafe>[1]
  await sql.unsafe(query, postgresParameters)
}

export const postgresWebVitalsStore = createPostgresWebVitalsStore(
  executePostgresWebVitalInsert
)
