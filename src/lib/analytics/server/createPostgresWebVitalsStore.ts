import type { WebVitalInsertRow } from './mapCanonicalWebVitalToRow'

export type CanonicalWebVitalStore = {
  insert: (row: WebVitalInsertRow) => Promise<void>
}

export type WebVitalsQueryExecutor = (
  query: string,
  parameters: readonly unknown[]
) => Promise<void>

export const INSERT_OPS_WEB_VITAL_QUERY = `
insert into ops.web_vitals (
  metric_id,
  name,
  value,
  delta,
  rating,
  pathname,
  href,
  referrer,
  navigation_type,
  attribution,
  entries,
  reported_at
) values (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10::jsonb,
  $11::jsonb,
  $12::timestamptz
)
`

export function createPostgresWebVitalsStore(
  execute: WebVitalsQueryExecutor
): CanonicalWebVitalStore {
  return {
    insert: async row => {
      await execute(INSERT_OPS_WEB_VITAL_QUERY, [
        row.metric_id,
        row.name,
        row.value,
        row.delta,
        row.rating ?? null,
        row.pathname,
        row.href,
        row.referrer ?? null,
        row.navigation_type ?? null,
        row.attribution === undefined ? null : JSON.stringify(row.attribution),
        JSON.stringify(row.entries),
        row.reported_at
      ])
    }
  }
}
