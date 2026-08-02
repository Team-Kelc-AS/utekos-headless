import postgres from 'postgres'

import type { VercelEdgeRequestObservation } from './contracts.ts'

export type ObservationWriter = (
  observations: VercelEdgeRequestObservation[]
) => Promise<number>

export function createObservationWriter(
  databaseUrl: string
): ObservationWriter {
  const sql = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 5,
    max: 1,
    prepare: false
  })

  return async observations => {
    if (observations.length === 0) return 0

    const result = await sql`
      insert into ops.vercel_edge_request_observations
      ${sql(observations)}
      on conflict (vercel_log_id) do nothing
    `

    return result.count
  }
}
