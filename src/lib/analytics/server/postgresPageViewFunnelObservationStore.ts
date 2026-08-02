import 'server-only'
import postgres from 'postgres'
import type { PageViewFunnelObservationStore } from './pageViewFunnelObservationStore'

let trackingSql: ReturnType<typeof postgres> | undefined

function getTrackingSql() {
  const connectionString =
    process.env.SUPABASE_VERCEL_POSTGRES_URL ??
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
    max_lifetime: 60 * 30,
    prepare: false
  })

  return trackingSql
}

export const postgresPageViewFunnelObservationStore: PageViewFunnelObservationStore =
  {
    recordBrowserDispatch: async observation => {
      const inserted = await getTrackingSql()`
        insert into ops.tagging_observations (
          idempotency_key,
          event_id,
          event_name,
          observation_type,
          page_view_id,
          edge_request_id,
          traffic_classification,
          observed_at
        ) values (
          ${`page_view_browser_dispatch:${observation.eventId}`},
          ${observation.eventId},
          'page_view',
          'browser_dispatch',
          ${observation.pageViewId},
          ${observation.edgeRequestId},
          ${observation.trafficClassification},
          ${observation.observedAt}
        )
        on conflict (idempotency_key) do nothing
        returning id
      `

      return inserted.length === 1
    },

    recordCollectorReceipt: async observation => {
      const inserted = await getTrackingSql()`
        insert into ops.tagging_observations (
          idempotency_key,
          event_id,
          event_name,
          observation_type,
          page_view_id,
          edge_request_id,
          observed_at
        ) values (
          ${`page_view_collector_received:${observation.eventId}`},
          ${observation.eventId},
          'page_view',
          'collector_received',
          ${observation.pageViewId},
          ${observation.edgeRequestId},
          ${observation.observedAt}
        )
        on conflict (idempotency_key) do nothing
        returning id
      `

      return inserted.length === 1
    }
  }
