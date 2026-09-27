import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseVippsCheckoutState } from './checkoutStore'

const state = {
  handle: 'vipps-express-test',
  variantId: 'gid://shopify/ProductVariant/1',
  stage: 'new' as const,
  termsAcceptedAt: '2026-09-27T00:00:00.000Z'
}

test('checkout storage accepts JSONB returned as an object or serialized text', () => {
  assert.deepEqual(parseVippsCheckoutState(state), state)
  assert.deepEqual(parseVippsCheckoutState(JSON.stringify(state)), state)
})
