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

test('maps metrics + visible/delayed split to privacy-safe health fields', async () => {
  const metrics = await getDunWaitlistShopifyQueueMetrics({
    executeQuery: async <T extends DunWaitlistShopifyQueueQueryRow>(
      query: string,
      parameters: readonly unknown[]
    ) => {
      assert.match(query, /pgmq\.metrics/)
      assert.match(query, /visible_count/)
      assert.match(query, /delayed_count/)
      assert.match(query, /q_shopify_dun_waitlist_sync/)
      assert.doesNotMatch(query, /message\b/)
      assert.deepEqual(parameters, [DUN_WAITLIST_SHOPIFY_QUEUE_NAME])
      return [
        {
          queue_length: 3,
          newest_msg_age_sec: 12,
          oldest_msg_age_sec: 90,
          total_messages: 40,
          visible_count: 1,
          delayed_count: 2,
          oldest_visible_age_sec: 90,
          oldest_delayed_vt: '2026-08-07T17:00:00.000Z'
        }
      ] as unknown as T[]
    }
  })

  assert.deepEqual(metrics, {
    queueLength: 3,
    newestMsgAgeSec: 12,
    oldestMsgAgeSec: 90,
    totalMessages: 40,
    visibleCount: 1,
    delayedCount: 2,
    oldestVisibleAgeSec: 90,
    oldestDelayedVt: '2026-08-07T17:00:00.000Z',
    healthLevel: 'healthy'
  })
})

test('classifies warning when oldest visible age is at least 15 minutes', async () => {
  const metrics = await getDunWaitlistShopifyQueueMetrics({
    executeQuery: async <T extends DunWaitlistShopifyQueueQueryRow>() =>
      [
        {
          queue_length: 1,
          newest_msg_age_sec: 900,
          oldest_msg_age_sec: 900,
          total_messages: 5,
          visible_count: 1,
          delayed_count: 0,
          oldest_visible_age_sec: 900,
          oldest_delayed_vt: null
        }
      ] as unknown as T[]
  })

  assert.equal(metrics.healthLevel, 'warning')
  assert.equal(metrics.oldestVisibleAgeSec, 900)
})

test('classifies critical when oldest visible age is at least 30 minutes', async () => {
  const metrics = await getDunWaitlistShopifyQueueMetrics({
    executeQuery: async <T extends DunWaitlistShopifyQueueQueryRow>() =>
      [
        {
          queue_length: 2,
          newest_msg_age_sec: 1800,
          oldest_msg_age_sec: 1800,
          total_messages: 8,
          visible_count: 2,
          delayed_count: 0,
          oldest_visible_age_sec: 1800,
          oldest_delayed_vt: null
        }
      ] as unknown as T[]
  })

  assert.equal(metrics.healthLevel, 'critical')
})
