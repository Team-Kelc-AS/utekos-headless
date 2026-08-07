import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
  dunWaitlistShopifyQueueMessageSchema
} from './dunWaitlistShopifyQueueMessage'

const validLeadId = '550e8400-e29b-41d4-a716-446655440000'

test('accepts a valid schema_version 1 queue message', () => {
  const result = dunWaitlistShopifyQueueMessageSchema.safeParse({
    schema_version: 1,
    lead_id: validLeadId
  })

  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.schema_version, 1)
    assert.equal(result.data.lead_id, validLeadId)
  }
})

test('rejects a message missing schema_version', () => {
  const result = dunWaitlistShopifyQueueMessageSchema.safeParse({
    lead_id: validLeadId
  })

  assert.equal(result.success, false)
})

test('rejects schema_version 2', () => {
  const result = dunWaitlistShopifyQueueMessageSchema.safeParse({
    schema_version: 2,
    lead_id: validLeadId
  })

  assert.equal(result.success, false)
})

test('rejects an invalid lead_id UUID', () => {
  const result = dunWaitlistShopifyQueueMessageSchema.safeParse({
    schema_version: 1,
    lead_id: 'not-a-uuid'
  })

  assert.equal(result.success, false)
})

test('rejects extra properties via strictObject', () => {
  const result = dunWaitlistShopifyQueueMessageSchema.safeParse({
    schema_version: 1,
    lead_id: validLeadId,
    attempt_count: 1
  })

  assert.equal(result.success, false)
})

test('rejects PII property email in the queue message', () => {
  const result = dunWaitlistShopifyQueueMessageSchema.safeParse({
    schema_version: 1,
    lead_id: validLeadId,
    email: 'kunde@example.no'
  })

  assert.equal(result.success, false)
})

test('exports the canonical durable queue name', () => {
  assert.equal(
    DUN_WAITLIST_SHOPIFY_QUEUE_NAME,
    'shopify_dun_waitlist_sync'
  )
})
