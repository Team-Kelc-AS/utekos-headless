import 'server-only'

import postgres from 'postgres'
import { getPostgresClient } from '../../db/getPostgresClient'
import type { ProvisionalPageViewCaptureStore } from './provisionalPageViewCaptureStore'

function getTrackingSql() {
  const sql = getPostgresClient()

  if (!sql) {
    throw new Error(
      'Missing tracking database connection string'
    )
  }

  return sql
}

export const postgresProvisionalPageViewCaptureStore: ProvisionalPageViewCaptureStore =
  {
    capture: async capture => {
      const { event } = capture
      const rows = await getTrackingSql()`
        insert into marketing.provisional_page_view_captures (
          event_id,
          page_view_id,
          edge_request_id,
          capture_state,
          payload,
          occurred_at
        ) values (
          ${event.event_id}::uuid,
          ${event.page_view_id}::uuid,
          ${event.edge_request_id ?? null}::uuid,
          ${capture.capture_state},
          ${getTrackingSql().json(event as postgres.JSONValue)},
          ${event.event_time}
        )
        on conflict (event_id) do update
        set
          capture_state = case
            when marketing.provisional_page_view_captures.capture_state = 'granted'
              then 'granted'
            when excluded.capture_state = 'granted'
              then 'granted'
            when marketing.provisional_page_view_captures.capture_state = 'denied'
              then 'denied'
            else excluded.capture_state
          end,
          payload = case
            when excluded.capture_state = 'granted'
              or marketing.provisional_page_view_captures.capture_state <> 'granted'
              then excluded.payload
            else marketing.provisional_page_view_captures.payload
          end,
          capture_count = marketing.provisional_page_view_captures.capture_count + 1,
          updated_at = statement_timestamp(),
          expires_at = statement_timestamp() + interval '24 hours'
        where
          marketing.provisional_page_view_captures.page_view_id = excluded.page_view_id
          and marketing.provisional_page_view_captures.edge_request_id is not distinct from excluded.edge_request_id
          and marketing.provisional_page_view_captures.occurred_at = excluded.occurred_at
        returning (xmax = 0) as inserted
      `

      if (rows.length !== 1) {
        throw new Error(
          'provisional_page_view_capture_identity_conflict'
        )
      }

      return rows[0]?.inserted ? 'inserted' : 'updated'
    },
    release: async eventId => {
      await getTrackingSql()`
        delete from marketing.provisional_page_view_captures
        where event_id = ${eventId}::uuid
      `
    }
  }
