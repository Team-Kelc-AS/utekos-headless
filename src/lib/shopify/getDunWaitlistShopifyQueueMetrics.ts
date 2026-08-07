import 'server-only'

import { z } from 'zod'

import {
  classifyDunWaitlistShopifyQueueHealthLevel,
  type DunWaitlistShopifyQueueHealthLevel
} from './dunWaitlistShopifyQueueConfig'
import { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } from './dunWaitlistShopifyQueueMessage'
import {
  executeDunWaitlistShopifyQueueQuery,
  type DunWaitlistShopifyQueueQueryExecutor
} from './dunWaitlistShopifyQueueDb'

export type DunWaitlistShopifyQueueMetrics = {
  queueLength: number
  newestMsgAgeSec: number | null
  oldestMsgAgeSec: number | null
  totalMessages: number
  visibleCount: number
  delayedCount: number
  oldestVisibleAgeSec: number | null
  oldestDelayedVt: string | null
  healthLevel: DunWaitlistShopifyQueueHealthLevel
}

export type GetDunWaitlistShopifyQueueMetricsDependencies = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
}

const defaultDependencies: GetDunWaitlistShopifyQueueMetricsDependencies =
  {
    executeQuery: executeDunWaitlistShopifyQueueQuery
  }

const metricsRowSchema = z.strictObject({
  queue_length: z.coerce.number().int().nonnegative(),
  newest_msg_age_sec: z.coerce.number().int().nullable(),
  oldest_msg_age_sec: z.coerce.number().int().nullable(),
  total_messages: z.coerce.number().int().nonnegative(),
  visible_count: z.coerce.number().int().nonnegative(),
  delayed_count: z.coerce.number().int().nonnegative(),
  oldest_visible_age_sec: z.coerce.number().int().nullable(),
  oldest_delayed_vt: z.union([z.string(), z.date()]).nullable()
})

/**
 * Privacy-safe queue health: pgmq.metrics plus visible vs delayed split.
 * Does not return message payloads or PII.
 */
const METRICS_QUERY = `
  with metrics as (
    select
      queue_length,
      newest_msg_age_sec,
      oldest_msg_age_sec,
      total_messages
    from pgmq.metrics($1::text)
  ),
  visibility as (
    select
      count(*) filter (where q.vt <= clock_timestamp())::bigint as visible_count,
      count(*) filter (where q.vt > clock_timestamp())::bigint as delayed_count,
      floor(
        extract(
          epoch from (
            clock_timestamp() - min(q.enqueued_at) filter (
              where q.vt <= clock_timestamp()
            )
          )
        )
      )::integer as oldest_visible_age_sec,
      min(q.vt) filter (where q.vt > clock_timestamp()) as oldest_delayed_vt
    from pgmq.q_shopify_dun_waitlist_sync as q
  )
  select
    metrics.queue_length,
    metrics.newest_msg_age_sec,
    metrics.oldest_msg_age_sec,
    metrics.total_messages,
    coalesce(visibility.visible_count, 0)::bigint as visible_count,
    coalesce(visibility.delayed_count, 0)::bigint as delayed_count,
    visibility.oldest_visible_age_sec,
    visibility.oldest_delayed_vt
  from metrics
  cross join visibility
`

export async function getDunWaitlistShopifyQueueMetrics(
  dependencies: GetDunWaitlistShopifyQueueMetricsDependencies =
    defaultDependencies
): Promise<DunWaitlistShopifyQueueMetrics> {
  const rows = await dependencies.executeQuery(METRICS_QUERY, [
    DUN_WAITLIST_SHOPIFY_QUEUE_NAME
  ])

  const row = metricsRowSchema.parse(rows[0])
  const oldestDelayedVt =
    row.oldest_delayed_vt === null ? null
    : row.oldest_delayed_vt instanceof Date ?
      row.oldest_delayed_vt.toISOString()
    : row.oldest_delayed_vt

  return {
    queueLength: row.queue_length,
    newestMsgAgeSec: row.newest_msg_age_sec,
    oldestMsgAgeSec: row.oldest_msg_age_sec,
    totalMessages: row.total_messages,
    visibleCount: row.visible_count,
    delayedCount: row.delayed_count,
    oldestVisibleAgeSec: row.oldest_visible_age_sec,
    oldestDelayedVt,
    healthLevel: classifyDunWaitlistShopifyQueueHealthLevel(
      row.oldest_visible_age_sec
    )
  }
}
