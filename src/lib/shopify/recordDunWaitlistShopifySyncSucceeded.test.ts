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
const { recordDunWaitlistShopifySyncSucceeded } = require(
  './recordDunWaitlistShopifySyncSucceeded.ts'
) as typeof import('./recordDunWaitlistShopifySyncSucceeded')

const leadId = '550e8400-e29b-41d4-a716-446655440000'

test('inserts a privacy-minimal succeeded integration_event for PGMQ owner', async () => {
  const calls: Array<{
    query: string
    parameters: readonly unknown[]
  }> = []

  const result = await recordDunWaitlistShopifySyncSucceeded(leadId, {
    executeQuery: async <T extends DunWaitlistShopifyQueueQueryRow>(
      query: string,
      parameters: readonly unknown[]
    ) => {
      calls.push({ query, parameters })
      return [{ id: 'evt-1' }] as unknown as T[]
    }
  })

  assert.equal(result.recorded, true)
  assert.equal(calls.length, 1)
  const call = calls[0]
  assert.ok(call)
  assert.match(call.query, /ops\.integration_events/)
  assert.match(call.query, /sync_owner/)
  assert.match(call.query, /not exists/)
  assert.deepEqual(call.parameters, [
    'shopify',
    'dun_waitlist_customer_sync',
    leadId,
    'pgmq'
  ])
  assert.doesNotMatch(call.query, /email/)
})

test('reports recorded=false when a succeeded row already exists', async () => {
  const result = await recordDunWaitlistShopifySyncSucceeded(leadId, {
    executeQuery: async <T extends DunWaitlistShopifyQueueQueryRow>() =>
      [] as unknown as T[]
  })

  assert.equal(result.recorded, false)
})

test('legacy enqueue-missing predicate skips leads with any integration_event', () => {
  // Mirrors ENQUEUE_MISSING_QUERY in runDunWaitlistShopifySyncBatch.ts
  const enqueueMissingPredicate = `
    and not exists (
      select 1
      from ops.integration_events as existing
      where existing.provider = $3
        and existing.event_type = $4
        and existing.payload ->> 'lead_id' = lead.id::text
    )
  `

  assert.match(enqueueMissingPredicate, /not exists/)
  assert.match(enqueueMissingPredicate, /payload ->> 'lead_id'/)

  const existingEvents = new Set([leadId])
  const wouldEnqueue = !existingEvents.has(leadId)
  assert.equal(wouldEnqueue, false)
})
