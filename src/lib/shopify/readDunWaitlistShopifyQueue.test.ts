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
const { readDunWaitlistShopifyQueue } = require(
  './readDunWaitlistShopifyQueue.ts'
) as typeof import('./readDunWaitlistShopifyQueue')
const { DUN_WAITLIST_SHOPIFY_QUEUE_VISIBILITY_TIMEOUT_SECONDS } =
  require('./readDunWaitlistShopifyQueue.ts') as typeof import('./readDunWaitlistShopifyQueue')

test('maps pgmq.read rows through the strict record schema', async () => {
  const records = await readDunWaitlistShopifyQueue(
    { maxItems: 2 },
    {
      executeQuery: async <T extends Record<string, unknown>>(
        _query: string,
        parameters: readonly unknown[]
      ) => {
        assert.equal(parameters[0], 'shopify_dun_waitlist_sync')
        assert.equal(
          parameters[1],
          DUN_WAITLIST_SHOPIFY_QUEUE_VISIBILITY_TIMEOUT_SECONDS
        )
        assert.equal(parameters[2], 2)

        return [
          {
            msg_id: '9007199254740993',
            read_ct: 1,
            enqueued_at: new Date('2026-08-07T12:00:00.000Z'),
            vt: new Date('2026-08-07T12:02:00.000Z'),
            message: {
              schema_version: 1,
              lead_id: '550e8400-e29b-41d4-a716-446655440000'
            }
          }
        ] as unknown as T[]
      }
    }
  )

  assert.equal(records.length, 1)
  assert.equal(records[0]?.msg_id, '9007199254740993')
  assert.equal(records[0]?.read_ct, 1)
})

test('allows an injected short visibility timeout for tests', async () => {
  await readDunWaitlistShopifyQueue(
    {
      maxItems: 1,
      visibilityTimeoutSeconds: 2
    },
    {
      executeQuery: async <T extends Record<string, unknown>>(
        _query: string,
        parameters: readonly unknown[]
      ) => {
        assert.equal(parameters[1], 2)
        return [] as unknown as T[]
      }
    }
  )
})
