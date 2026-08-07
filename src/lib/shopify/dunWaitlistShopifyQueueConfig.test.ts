import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyDunWaitlistShopifyQueueHealthLevel,
  DUN_WAITLIST_SHOPIFY_QUEUE_ARCHIVE_RETENTION_DAYS,
  DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_CRITICAL_SECONDS,
  DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_WARNING_SECONDS
} from './dunWaitlistShopifyQueueConfig'

test('health level is healthy when no visible messages', () => {
  assert.equal(classifyDunWaitlistShopifyQueueHealthLevel(null), 'healthy')
})

test('health level warns at 15 minutes visible age', () => {
  assert.equal(
    classifyDunWaitlistShopifyQueueHealthLevel(
      DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_WARNING_SECONDS
    ),
    'warning'
  )
  assert.equal(
    classifyDunWaitlistShopifyQueueHealthLevel(
      DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_WARNING_SECONDS - 1
    ),
    'healthy'
  )
})

test('health level is critical at 30 minutes visible age', () => {
  assert.equal(
    classifyDunWaitlistShopifyQueueHealthLevel(
      DUN_WAITLIST_SHOPIFY_QUEUE_VISIBLE_AGE_CRITICAL_SECONDS
    ),
    'critical'
  )
})

test('archive retention constant is 30 days', () => {
  assert.equal(DUN_WAITLIST_SHOPIFY_QUEUE_ARCHIVE_RETENTION_DAYS, 30)
})
