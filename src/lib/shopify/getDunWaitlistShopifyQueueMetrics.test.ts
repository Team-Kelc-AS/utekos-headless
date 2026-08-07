import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'

import type { DunWaitlistShopifyQueueQueryRow } from './dunWaitlistShopifyQueueDb'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { getDunWaitlistShopifyQueueMetrics } = require(
  './getDunWaitlistShopifyQueueMetrics.ts'
) as typeof import('./getDunWaitlistShopifyQueueMetrics')
const { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } = require(
  './dunWaitlistShopifyQueueMessage.ts'
) as typeof import('./dunWaitlistShopifyQueueMessage')

test('maps pgmq.metrics row to bounded queue health fields', async () => {
  const metrics = await getDunWaitlistShopifyQueueMetrics({
    executeQuery: async <T extends DunWaitlistShopifyQueueQueryRow>(
      query: string,
      parameters: readonly unknown[]
    ) => {
      assert.match(query, /pgmq\.metrics/)
      assert.deepEqual(parameters, [DUN_WAITLIST_SHOPIFY_QUEUE_NAME])
      return [
        {
          queue_length: 3,
          newest_msg_age_sec: 12,
          oldest_msg_age_sec: 90,
          total_messages: 40
        }
      ] as unknown as T[]
    }
  })

  assert.deepEqual(metrics, {
    queueLength: 3,
    newestMsgAgeSec: 12,
    oldestMsgAgeSec: 90,
    totalMessages: 40
  })
})
