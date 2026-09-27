import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseVippsCheckoutState } from './checkoutStore'

const currentState = {
  handle: 'vipps-express-test',
  variantId: 'gid://shopify/ProductVariant/1',
  stage: 'new' as const,
  checkoutStartedAt: '2026-09-27T00:00:00.000Z'
}

const legacyState = {
  handle: 'vipps-express-test',
  variantId: 'gid://shopify/ProductVariant/1',
  stage: 'new' as const,
  termsAcceptedAt: '2026-09-27T00:00:00.000Z'
}

test('checkout storage accepts JSONB returned as an object or serialized text', () => {
  assert.deepEqual(parseVippsCheckoutState(currentState), currentState)
  assert.deepEqual(
    parseVippsCheckoutState(JSON.stringify(currentState)),
    currentState
  )
})

test('checkout storage preserves legacy attempts without falsely requiring new UI data', () => {
  assert.deepEqual(parseVippsCheckoutState(legacyState), legacyState)
})

test('checkout storage preserves an idempotent Shopify checkout fallback', () => {
  const fallback = {
    ...currentState,
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
