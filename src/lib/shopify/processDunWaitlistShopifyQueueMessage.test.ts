import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'

import type { DunWaitlistShopifyQueueRecord } from './dunWaitlistShopifyQueueRecord'

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
const { processDunWaitlistShopifyQueueMessage } = require(
  './processDunWaitlistShopifyQueueMessage.ts'
) as typeof import('./processDunWaitlistShopifyQueueMessage')

const leadId = '550e8400-e29b-41d4-a716-446655440000'

function makeRecord(
  message: unknown,
  overrides: Partial<DunWaitlistShopifyQueueRecord> = {}
): DunWaitlistShopifyQueueRecord {
  return {
    msg_id: '11',
    read_ct: 1,
    enqueued_at: new Date('2026-08-07T12:00:00.000Z'),
    vt: new Date('2026-08-07T12:02:00.000Z'),
    message,
    ...overrides
  }
}

test('returns already_satisfied without calling Shopify when legacy succeeded', async () => {
  let syncCalls = 0

  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 1,
      lead_id: leadId
    }),
    {
      executeQuery: async () => {
        throw new Error('lead load should not run')
      },
      isLegacySatisfied: async () => true,
      syncCustomer: async () => {
        syncCalls += 1
        return { customerId: 'gid://shopify/Customer/1' }
      }
    }
  )

  assert.deepEqual(result, { status: 'already_satisfied' })
  assert.equal(syncCalls, 0)
})

test('syncs a valid unsatisfied lead exactly once', async () => {
  let syncCalls = 0

  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 1,
      lead_id: leadId
    }),
    {
      executeQuery: async <T extends Record<string, unknown>>() =>
        [
          {
            email: 'kunde@example.no',
            first_name: 'Kari',
            phone: null
          }
        ] as unknown as T[],
      isLegacySatisfied: async () => false,
      syncCustomer: async input => {
        syncCalls += 1
        assert.equal(input.email, 'kunde@example.no')
        return { customerId: 'gid://shopify/Customer/99' }
      }
    }
  )

  assert.deepEqual(result, {
    status: 'succeeded',
    customerId: 'gid://shopify/Customer/99',
    leadId
  })
  assert.equal(syncCalls, 1)
})

test('maps invalid payload to permanent invalid_queue_message without Shopify', async () => {
  let syncCalls = 0

  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 2,
      lead_id: leadId
    }),
    {
      executeQuery: async () => [],
      isLegacySatisfied: async () => false,
      syncCustomer: async () => {
        syncCalls += 1
        return { customerId: 'gid://shopify/Customer/1' }
      }
    }
  )

  assert.deepEqual(result, {
    status: 'failure',
    kind: 'permanent',
    reason: 'invalid_queue_message'
  })
  assert.equal(syncCalls, 0)
})

test('maps missing lead to permanent lead_not_found without Shopify', async () => {
  let syncCalls = 0

  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 1,
      lead_id: leadId
    }),
    {
      executeQuery: async () => [],
      isLegacySatisfied: async () => false,
      syncCustomer: async () => {
        syncCalls += 1
        return { customerId: 'gid://shopify/Customer/1' }
      }
    }
  )

  assert.deepEqual(result, {
    status: 'failure',
    kind: 'permanent',
    reason: 'lead_not_found',
    leadId,
    schemaVersion: 1
  })
  assert.equal(syncCalls, 0)
})

test('maps invalid lead record to permanent invalid_lead_record without Shopify', async () => {
  let syncCalls = 0

  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 1,
      lead_id: leadId
    }),
    {
      executeQuery: async <T extends Record<string, unknown>>() =>
        [
          {
            email: '   ',
            first_name: null,
            phone: null
          }
        ] as unknown as T[],
      isLegacySatisfied: async () => false,
      syncCustomer: async () => {
        syncCalls += 1
        return { customerId: 'gid://shopify/Customer/1' }
      }
    }
  )

  assert.deepEqual(result, {
    status: 'failure',
    kind: 'permanent',
    reason: 'invalid_lead_record',
    leadId,
    schemaVersion: 1
  })
  assert.equal(syncCalls, 0)
})

test('maps sync failures to classified failure without throwing', async () => {
  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 1,
      lead_id: leadId
    }),
    {
      executeQuery: async <T extends Record<string, unknown>>() =>
        [
          {
            email: 'kunde@example.no',
            first_name: null,
            phone: null
          }
        ] as unknown as T[],
      isLegacySatisfied: async () => false,
      syncCustomer: async () => {
        throw new Error('shopify_customer_create_failed')
      }
    }
  )

  assert.deepEqual(result, {
    status: 'failure',
    kind: 'transient',
    reason: 'shopify_customer_create_failed',
    leadId,
    schemaVersion: 1
  })
})

test('maps permanent Shopify rejection without retry classification ambiguity', async () => {
  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 1,
      lead_id: leadId
    }),
    {
      executeQuery: async <T extends Record<string, unknown>>() =>
        [
          {
            email: 'kunde@example.no',
            first_name: null,
            phone: null
          }
        ] as unknown as T[],
      isLegacySatisfied: async () => false,
      syncCustomer: async () => {
        throw new Error('shopify_customer_create_rejected')
      }
    }
  )

  assert.deepEqual(result, {
    status: 'failure',
    kind: 'permanent',
    reason: 'shopify_customer_create_rejected',
    leadId,
    schemaVersion: 1
  })
})

test('unknown sync errors become transient unexpected_error', async () => {
  const result = await processDunWaitlistShopifyQueueMessage(
    makeRecord({
      schema_version: 1,
      lead_id: leadId
    }),
    {
      executeQuery: async <T extends Record<string, unknown>>() =>
        [
          {
            email: 'kunde@example.no',
            first_name: null,
            phone: null
          }
        ] as unknown as T[],
      isLegacySatisfied: async () => false,
      syncCustomer: async () => {
        throw new Error('ECONNRESET')
      }
    }
  )

  assert.deepEqual(result, {
    status: 'failure',
    kind: 'transient',
    reason: 'unexpected_error',
    leadId,
    schemaVersion: 1
  })
})
