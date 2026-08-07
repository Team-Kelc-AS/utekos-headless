import 'server-only'

import { z } from 'zod'

import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'

import { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } from './dunWaitlistShopifyQueueMessage'
import {
  executeDunWaitlistShopifyQueueQuery,
  type DunWaitlistShopifyQueueQueryExecutor
} from './dunWaitlistShopifyQueueDb'
import { toPgmqMsgIdSqlParameter } from './dunWaitlistShopifyQueueRecord'

export type SetDunWaitlistShopifyQueueVisibilityDependencies = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
}

const defaultDependencies: SetDunWaitlistShopifyQueueVisibilityDependencies =
  {
    executeQuery: executeDunWaitlistShopifyQueueQuery
  }

const vtOffsetSecondsSchema = z.number().int().nonnegative()

const SET_VT_QUERY = `
  select msg_id::text as msg_id
  from pgmq.set_vt(
    $1::text,
    $2::bigint,
    $3::integer
  )
`

export async function setDunWaitlistShopifyQueueVisibility(
  input: {
    msgId: string
    visibilityTimeoutSeconds: number
  },
  dependencies: SetDunWaitlistShopifyQueueVisibilityDependencies =
    defaultDependencies
): Promise<boolean> {
  const sqlMsgId = toPgmqMsgIdSqlParameter(input.msgId)
  const vtOffsetSeconds = vtOffsetSecondsSchema.parse(
    input.visibilityTimeoutSeconds
  )

  return startAnalyticsSpan(
    {
      name: 'dun-waitlist-shopify-queue-retry',
      op: 'queue.retry',
      attributes: {
        'messaging.system': 'postgres_pgmq',
        'messaging.destination.name': DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
        'messaging.operation.type': 'retry',
        'messaging.message.id': sqlMsgId,
        'retry.delay_seconds': vtOffsetSeconds
      }
    },
    async () => {
      const rows = await dependencies.executeQuery<{
        msg_id: string
      }>(SET_VT_QUERY, [
        DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
        sqlMsgId,
        vtOffsetSeconds
      ])

      return rows.length === 1
    }
  )
}
