import 'server-only'

import { z } from 'zod'

import {
  executeDunWaitlistShopifyQueueQuery,
  type DunWaitlistShopifyQueueQueryExecutor
} from './dunWaitlistShopifyQueueDb'

const PROVIDER = 'shopify'
const EVENT_TYPE = 'dun_waitlist_customer_sync'
const SYNC_OWNER = 'pgmq'

export type RecordDunWaitlistShopifySyncSucceededDependencies = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
}

const defaultDependencies: RecordDunWaitlistShopifySyncSucceededDependencies =
  {
    executeQuery: executeDunWaitlistShopifyQueueQuery
  }

const leadIdSchema = z.string().uuid()

/**
 * Durable business evidence for a PGMQ-owned Shopify sync success.
 * Guarded insert: at most one succeeded row per lead_id for this event type.
 * Enables already_satisfied redelivery and legacy enqueue-skip on rollback.
 */
const RECORD_SUCCEEDED_QUERY = `
  insert into ops.integration_events (
    provider,
    event_type,
    status,
    payload,
    processed_at
  )
  select
    $1::text,
    $2::text,
    'succeeded',
    jsonb_build_object(
      'lead_id', $3::uuid,
      'synced_at', now()::text,
      'sync_owner', $4::text
    ),
    now()
  where not exists (
    select 1
    from ops.integration_events as existing
    where existing.provider = $1::text
      and existing.event_type = $2::text
      and existing.status = 'succeeded'
      and existing.payload ->> 'lead_id' = $3::text
  )
  returning id::text as id
`

export async function recordDunWaitlistShopifySyncSucceeded(
  leadId: string,
  dependencies: RecordDunWaitlistShopifySyncSucceededDependencies =
    defaultDependencies
): Promise<{ recorded: boolean }> {
  const parsedLeadId = leadIdSchema.parse(leadId)

  const rows = await dependencies.executeQuery<{ id: string }>(
    RECORD_SUCCEEDED_QUERY,
    [PROVIDER, EVENT_TYPE, parsedLeadId, SYNC_OWNER]
  )

  return { recorded: rows.length === 1 }
}
