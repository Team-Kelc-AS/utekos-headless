import postgres from 'postgres'

import type { VercelTraceObservation } from './contracts.ts'

export type TraceObservationWriter = (
  observations: VercelTraceObservation[]
) => Promise<number>

export function createTraceObservationWriter(
  databaseUrl: string
): TraceObservationWriter {
  const sql = postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 5,
    max: 1,
    prepare: false
  })

  return async observations => {
    if (observations.length === 0) return 0

    const result = await sql`
      insert into ops.vercel_trace_observations
      ${sql(observations)}
      on conflict (trace_id) do update
      set
        start_time_unix_nano = least(
          ops.vercel_trace_observations.start_time_unix_nano,
          excluded.start_time_unix_nano
        ),
        end_time_unix_nano = greatest(
          ops.vercel_trace_observations.end_time_unix_nano,
          excluded.end_time_unix_nano
        ),
        duration_ms = (
          greatest(
            ops.vercel_trace_observations.end_time_unix_nano,
            excluded.end_time_unix_nano
          )
          - least(
            ops.vercel_trace_observations.start_time_unix_nano,
            excluded.start_time_unix_nano
          )
        ) / 1000000,
        observed_at = least(
          ops.vercel_trace_observations.observed_at,
          excluded.observed_at
        ),
        span_count = greatest(
          ops.vercel_trace_observations.span_count,
          excluded.span_count
        ),
        updated_at = statement_timestamp()
      where
        ops.vercel_trace_observations.project_id = excluded.project_id
        and ops.vercel_trace_observations.deployment_id = excluded.deployment_id
        and ops.vercel_trace_observations.environment = excluded.environment
    `

    return result.count
  }
}
