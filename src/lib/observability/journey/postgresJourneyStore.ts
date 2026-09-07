import 'server-only'
import { getPostgresClient } from '@/lib/db/getPostgresClient'
import { createJourneyStore } from './createJourneyStore'

export const postgresJourneyStore = createJourneyStore(
  async (query, parameters) => {
    const sql = getPostgresClient()
    if (!sql) throw new Error('Journey database unavailable')
    return sql.unsafe(
      query,
      parameters as Parameters<typeof sql.unsafe>[1]
    )
  }
)
