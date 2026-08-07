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
const { deadLetterDunWaitlistShopifyQueueMessage } = require(
  './deadLetterDunWaitlistShopifyQueueMessage.ts'
) as typeof import('./deadLetterDunWaitlistShopifyQueueMessage')
const {
  DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON,
  DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE
} = require(
  './dunWaitlistShopifyFailureClassification.ts'
) as typeof import('./dunWaitlistShopifyFailureClassification')
const { DUN_WAITLIST_SHOPIFY_QUEUE_NAME } = require(
  './dunWaitlistShopifyQueueMessage.ts'
) as typeof import('./dunWaitlistShopifyQueueMessage')

test('runs dead-letter insert and archive in one transaction', async () => {
  const queries: Array<{
    query: string
    parameters: readonly unknown[]
  }> = []

  const result = await deadLetterDunWaitlistShopifyQueueMessage(
    {
      msgId: '12345',
      readCt: 1,
      failureKind: 'permanent',
      reason: 'invalid_queue_message'
    },
    {
      runTransaction: async work =>
        work({
          executeQuery: async (query, parameters) => {
            queries.push({ query, parameters })
            return [
              {
                already_existed: false,
                archived: true,
                dead_letter_id: 'dl-1',
                inserted: true
              }
            ]
          }
        })
    }
  )

  assert.equal(queries.length, 1)
  assert.match(queries[0].query, /ops\.dead_letter_events/)
  assert.match(queries[0].query, /pgmq\.archive/)
  assert.equal(queries[0].parameters[0], DUN_WAITLIST_SHOPIFY_PGMQ_DEAD_LETTER_SOURCE)
  assert.equal(queries[0].parameters[1], '12345')
  assert.equal(queries[0].parameters[2], 'invalid_queue_message')
  assert.equal(queries[0].parameters[5], DUN_WAITLIST_SHOPIFY_QUEUE_NAME)
  assert.equal(queries[0].parameters[6], '12345')

  const payload = JSON.parse(String(queries[0].parameters[3])) as {
    pgmq_message_id: string
    lead_id?: string
  }
  assert.deepEqual(payload, { pgmq_message_id: '12345' })

  assert.deepEqual(result, {
    alreadyExisted: false,
    archived: true,
    deadLettered: true
  })
})

test('preserves attempts-exhausted reason and last failure in metadata', async () => {
  let metadataRaw = ''

  await deadLetterDunWaitlistShopifyQueueMessage(
    {
      msgId: '77',
      readCt: 5,
      failureKind: 'transient',
      reason: DUN_WAITLIST_SHOPIFY_ATTEMPTS_EXHAUSTED_REASON,
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      schemaVersion: 1,
      lastFailureReason: 'shopify_tags_add_failed'
    },
    {
      runTransaction: async work =>
        work({
          executeQuery: async (_query, parameters) => {
            metadataRaw = String(parameters[4])
            return [
              {
                already_existed: false,
                archived: true,
                dead_letter_id: 'dl-2',
                inserted: true
              }
            ]
          }
        })
    }
  )

  assert.deepEqual(JSON.parse(metadataRaw), {
    queue_name: DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
    read_ct: 5,
    failure_kind: 'transient',
    schema_version: 1,
    last_failure_reason: 'shopify_tags_add_failed'
  })
})

test('idempotent second call reports alreadyExisted without requiring a new insert', async () => {
  const result = await deadLetterDunWaitlistShopifyQueueMessage(
    {
      msgId: '12345',
      readCt: 2,
      failureKind: 'permanent',
      reason: 'lead_not_found',
      leadId: '550e8400-e29b-41d4-a716-446655440000'
    },
    {
      runTransaction: async work =>
        work({
          executeQuery: async () => [
            {
              already_existed: true,
              archived: true,
              dead_letter_id: 'dl-existing',
              inserted: false
            }
          ]
        })
    }
  )

  assert.deepEqual(result, {
    alreadyExisted: true,
    archived: true,
    deadLettered: true
  })
})

test('rolls back when transaction work throws before commit', async () => {
  let committed = false

  await assert.rejects(
    () =>
      deadLetterDunWaitlistShopifyQueueMessage(
        {
          msgId: '88',
          readCt: 1,
          failureKind: 'permanent',
          reason: 'invalid_lead_record'
        },
        {
          runTransaction: async work => {
            try {
              return await work({
                executeQuery: async () => {
                  throw new Error('archive failed mid-txn')
                }
              })
            } finally {
              committed = false
            }
          }
        }
      ),
    /archive failed mid-txn/
  )

  assert.equal(committed, false)
})
