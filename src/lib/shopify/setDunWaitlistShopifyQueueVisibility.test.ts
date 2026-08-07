import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'

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

  if (
    request === '@/lib/observability/tracing/startAnalyticsSpan' ||
    request.endsWith('/observability/tracing/startAnalyticsSpan') ||
    request.endsWith('/observability/tracing/startAnalyticsSpan.ts')
  ) {
    return {
      startAnalyticsSpan: <T>(
        _options: unknown,
        callback: () => T
      ) => callback()
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { setDunWaitlistShopifyQueueVisibility } = require(
  './setDunWaitlistShopifyQueueVisibility.ts'
) as typeof import('./setDunWaitlistShopifyQueueVisibility')
const { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } = require(
  './dunWaitlistShopifyQueueMessage.ts'
) as typeof import('./dunWaitlistShopifyQueueMessage')

test('calls pgmq.set_vt with queue name, bigint msg_id, and vt seconds', async () => {
  const calls: Array<{
    query: string
    parameters: readonly unknown[]
  }> = []

  const updated = await setDunWaitlistShopifyQueueVisibility(
    {
      msgId: '42',
      visibilityTimeoutSeconds: 300
    },
    {
      executeQuery: async (query, parameters) => {
        calls.push({ query, parameters })
        return [{ msg_id: '42' }]
      }
    }
  )

  assert.equal(updated, true)
  assert.equal(calls.length, 1)
  assert.match(calls[0].query, /pgmq\.set_vt/)
  assert.deepEqual(calls[0].parameters, [
    DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
    '42',
    300
  ])
  assert.match(calls[0].query, /\$2::bigint/)
})

test('returns false when set_vt updates no row', async () => {
  const updated = await setDunWaitlistShopifyQueueVisibility(
    {
      msgId: '99',
      visibilityTimeoutSeconds: 600
    },
    {
      executeQuery: async () => []
    }
  )

  assert.equal(updated, false)
})
