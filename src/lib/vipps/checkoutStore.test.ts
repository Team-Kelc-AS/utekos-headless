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

test('checkout storage preserves an idempotent Shopify checkout fallback', () => {
  const fallback = {
    ...state,
    stage: 'shopify_checkout_ready' as const,
    draftId: 'gid://shopify/DraftOrder/1',
    amount: 9900,
    shippingAmount: 9900,
    discountCode: 'KRISTOFFERTESTRABATT',
    shopifyCheckoutUrl:
      'https://erling-7921.myshopify.com/1/invoices/fixture'
  }
  assert.deepEqual(parseVippsCheckoutState(fallback), fallback)
})
