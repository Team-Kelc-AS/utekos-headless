import 'server-only'

import { z } from 'zod'

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
  total_messages: z.coerce.number().int().nonnegative()
})

const METRICS_QUERY = `
  select
    queue_length,
    newest_msg_age_sec,
    oldest_msg_age_sec,
    total_messages
  from pgmq.metrics($1::text)
`

export async function getDunWaitlistShopifyQueueMetrics(
  dependencies: GetDunWaitlistShopifyQueueMetricsDependencies =
    defaultDependencies
): Promise<DunWaitlistShopifyQueueMetrics> {
  const rows = await dependencies.executeQuery(METRICS_QUERY, [
    DUN_WAITLIST_SHOPIFY_QUEUE_NAME
  ])

  const row = metricsRowSchema.parse(rows[0])

  return {
    queueLength: row.queue_length,
    newestMsgAgeSec: row.newest_msg_age_sec,
    oldestMsgAgeSec: row.oldest_msg_age_sec,
    totalMessages: row.total_messages
  }
}
