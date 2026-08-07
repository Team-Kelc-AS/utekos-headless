import 'server-only'

import { z } from 'zod'

import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'

import {
  DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
  DUN_WAITLIST_SHOPIFY_QUEUE_VISIBILITY_TIMEOUT_SECONDS
} from './dunWaitlistShopifyQueueConfig'
import {
  executeDunWaitlistShopifyQueueQuery,
  type DunWaitlistShopifyQueueQueryExecutor
} from './dunWaitlistShopifyQueueDb'
import {
  dunWaitlistShopifyQueueRecordSchema,
  type DunWaitlistShopifyQueueRecord
} from './dunWaitlistShopifyQueueRecord'

export { DUN_WAITLIST_SHOPIFY_QUEUE_VISIBILITY_TIMEOUT_SECONDS }

const qtySchema = z.number().int().min(1).max(50)
const visibilityTimeoutSchema = z.number().int().min(1).max(3_600)

export type ReadDunWaitlistShopifyQueueInput = {
  maxItems: number
  visibilityTimeoutSeconds?: number
}

export type ReadDunWaitlistShopifyQueueDependencies = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
}

const defaultDependencies: ReadDunWaitlistShopifyQueueDependencies = {
  executeQuery: executeDunWaitlistShopifyQueueQuery
}

const READ_QUERY = `
  select
    msg_id,
    read_ct,
    enqueued_at,
    vt,
    message
  from pgmq.read(
    $1::text,
    $2::integer,
    $3::integer
  )
`

export async function readDunWaitlistShopifyQueue(
  input: ReadDunWaitlistShopifyQueueInput,
  dependencies: ReadDunWaitlistShopifyQueueDependencies =
    defaultDependencies
): Promise<DunWaitlistShopifyQueueRecord[]> {
  const maxItems = qtySchema.parse(input.maxItems)
  const visibilityTimeoutSeconds = visibilityTimeoutSchema.parse(
    input.visibilityTimeoutSeconds ??
      DUN_WAITLIST_SHOPIFY_QUEUE_VISIBILITY_TIMEOUT_SECONDS
  )

  return startAnalyticsSpan(
    {
      name: 'dun-waitlist-shopify-queue-read',
      op: 'queue.receive',
      attributes: {
        'messaging.system': 'postgres_pgmq',
        'messaging.destination.name': DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
        'messaging.operation.type': 'receive',
        'messaging.batch.message_count': maxItems
      }
    },
    async () => {
      const rows = await dependencies.executeQuery(
        READ_QUERY,
        [
          DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
          visibilityTimeoutSeconds,
          maxItems
        ]
      )

      return rows.map(row =>
        dunWaitlistShopifyQueueRecordSchema.parse(row)
      )
    }
  )
}
