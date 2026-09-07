import { createHash } from 'node:crypto'
import type { JourneyStore } from './journeyStore'

export type JourneyQuery = (
  query: string,
  parameters: readonly unknown[]
) => Promise<readonly Record<string, unknown>[]>

export function createJourneyStore(
  query: JourneyQuery
): JourneyStore {
  return {
    accept: async row => {
      const payload = JSON.stringify(row.event)
      const payloadHash = createHash('sha256')
        .update(payload)
        .digest('hex')
      const inserted = await query(
        `
        insert into ops.journey_events (
          event_id, journey_id, page_view_id, previous_page_view_id,
          event_name, occurred_at, received_at, page_path,
          consent, payload, payload_sha256, traffic_classification,
          environment, deployment_id, commit_sha
        ) values (
          $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5,
          $6::timestamptz, $7::timestamptz, $8,
          $9::text::jsonb, $10::text::jsonb, $11, $12, $13, $14, $15
        ) on conflict (event_id) do nothing
        returning event_id
      `,
        [
          row.event.event_id,
          row.event.journey_id,
          row.event.page_view_id,
          row.event.previous_page_view_id ?? null,
          row.event.event_name,
          row.event.occurred_at,
          row.received_at,
          row.event.page_path,
          // Bind serialized JSON as text so Postgres.js does not encode it twice.
          JSON.stringify(row.event.consent),
          payload,
          payloadHash,
          row.traffic_classification,
          row.runtime.environment,
          row.runtime.deploymentId,
          row.runtime.commitSha
        ]
      )
      if (inserted.length > 0) return 'persisted'

      // A separate statement sees the committed winner of a concurrent insert.
      const existing = await query(
        `
        select payload_sha256 = $2 as identical
        from ops.journey_events where event_id = $1::uuid
      `,
        [row.event.event_id, payloadHash]
      )
      if (existing.length === 0)
        throw new Error('Journey acceptance unavailable')
      return existing[0]?.identical === true ?
          'duplicate'
        : 'conflict'
    }
  }
}
