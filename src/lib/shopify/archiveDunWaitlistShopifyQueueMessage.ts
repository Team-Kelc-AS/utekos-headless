import 'server-only'

import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'

import { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } from './dunWaitlistShopifyQueueMessage'
import {
  executeDunWaitlistShopifyQueueQuery,
  type DunWaitlistShopifyQueueQueryExecutor
} from './dunWaitlistShopifyQueueDb'
import { toPgmqMsgIdSqlParameter } from './dunWaitlistShopifyQueueRecord'

export type ArchiveDunWaitlistShopifyQueueMessageDependencies = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
}

const defaultDependencies: ArchiveDunWaitlistShopifyQueueMessageDependencies =
  {
    executeQuery: executeDunWaitlistShopifyQueueQuery
  }

const ARCHIVE_QUERY = `
  select pgmq.archive(
    $1::text,
    $2::bigint
  ) as archived
`

export async function archiveDunWaitlistShopifyQueueMessage(
  msgId: string,
  dependencies: ArchiveDunWaitlistShopifyQueueMessageDependencies =
    defaultDependencies
): Promise<boolean> {
  const sqlMsgId = toPgmqMsgIdSqlParameter(msgId)

  return startAnalyticsSpan(
    {
      name: 'dun-waitlist-shopify-queue-archive',
      op: 'queue.ack',
      attributes: {
        'messaging.system': 'postgres_pgmq',
        'messaging.destination.name': DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
        'messaging.operation.type': 'ack',
        'messaging.message.id': sqlMsgId
      }
    },
    async () => {
      const rows = await dependencies.executeQuery<{
        archived: boolean
      }>(ARCHIVE_QUERY, [DUN_WAITLIST_SHOPIFY_QUEUE_NAME, sqlMsgId])

      return rows[0]?.archived === true
    }
  )
}
