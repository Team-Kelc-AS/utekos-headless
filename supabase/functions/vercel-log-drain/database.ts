import postgres from 'postgres'

import type { VercelEdgeRequestObservation } from './contracts.ts'
import type { DiagnosticObservation } from './diagnostics.ts'

export type ObservationWriter = (
  observations: VercelEdgeRequestObservation[],
  diagnostics: DiagnosticObservation[]
) => Promise<{
  insertedCount: number
  diagnosticInsertedCount: number
}>

export function createObservationWriter(
  databaseUrl: string
): ObservationWriter {
  const sql = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 5,
    max: 1,
    prepare: false
  })

  return async (observations, diagnostics) => {
    if (observations.length === 0 && diagnostics.length === 0)
      return { insertedCount: 0, diagnosticInsertedCount: 0 }
    return sql.begin(async transaction => {
      const insertedCount =
        observations.length ?
          (
            await transaction`
      insert into ops.vercel_edge_request_observations
      ${transaction(observations)}
      on conflict (vercel_log_id) do nothing
    `
          ).count
        : 0
      const diagnosticInsertedCount =
        diagnostics.length ?
          (
            await transaction`
      insert into ops.vercel_runtime_diagnostics
      ${transaction(diagnostics)}
      on conflict (vercel_log_id) do nothing
    `
          ).count
        : 0
      return { insertedCount, diagnosticInsertedCount }
    })
  }
}
