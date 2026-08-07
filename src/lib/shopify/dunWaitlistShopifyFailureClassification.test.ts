import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyDunWaitlistShopifyFailure,
  DUN_WAITLIST_SHOPIFY_LEGACY_PERMANENT_PROVIDER_REASONS,
  DUN_WAITLIST_SHOPIFY_MAX_ATTEMPTS,
  DUN_WAITLIST_SHOPIFY_PERMANENT_FAILURE_REASONS,
  failureReasonFromUnknown
} from './dunWaitlistShopifyFailureClassification'

test('MAX_ATTEMPTS matches legacy policy', () => {
  assert.equal(DUN_WAITLIST_SHOPIFY_MAX_ATTEMPTS, 5)
})

test('legacy permanent provider reasons are a subset of PGMQ permanent reasons', () => {
  for (const reason of DUN_WAITLIST_SHOPIFY_LEGACY_PERMANENT_PROVIDER_REASONS) {
    assert.equal(
      DUN_WAITLIST_SHOPIFY_PERMANENT_FAILURE_REASONS.has(
        reason as never
      ),
      true,
      `missing permanent reason: ${reason}`
    )
  }
})

test('classifies known permanent and transient Shopify reasons', () => {
  assert.deepEqual(
    classifyDunWaitlistShopifyFailure('shopify_customer_create_rejected'),
    {
      kind: 'permanent',
      reason: 'shopify_customer_create_rejected'
    }
  )

  assert.deepEqual(
    classifyDunWaitlistShopifyFailure('shopify_tags_add_failed'),
    {
      kind: 'transient',
      reason: 'shopify_tags_add_failed'
    }
  )
})

test('classifies queue-only permanent reasons', () => {
  assert.deepEqual(
    classifyDunWaitlistShopifyFailure('invalid_queue_message'),
    {
      kind: 'permanent',
      reason: 'invalid_queue_message'
    }
  )

  assert.deepEqual(classifyDunWaitlistShopifyFailure('lead_not_found'), {
    kind: 'permanent',
    reason: 'lead_not_found'
  })

  assert.deepEqual(
    classifyDunWaitlistShopifyFailure('invalid_lead_record'),
    {
      kind: 'permanent',
      reason: 'invalid_lead_record'
    }
  )
})

test('unknown errors are conservative transient unexpected_error', () => {
  assert.deepEqual(classifyDunWaitlistShopifyFailure('ECONNRESET'), {
    kind: 'transient',
    reason: 'unexpected_error'
  })

  assert.equal(
    failureReasonFromUnknown(new Error('socket hang up')),
    'unexpected_error'
  )

  assert.equal(failureReasonFromUnknown('not-an-error'), 'unexpected_error')
})
