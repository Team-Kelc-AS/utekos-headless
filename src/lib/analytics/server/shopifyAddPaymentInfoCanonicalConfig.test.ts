import assert from 'node:assert/strict'
import test from 'node:test'
import { readShopifyAddPaymentInfoCanonicalConfig } from './shopifyAddPaymentInfoCanonicalConfig'

test('defaults to disabled without an exact activation flag', () => {
  assert.deepEqual(
    readShopifyAddPaymentInfoCanonicalConfig({
      SHOPIFY_ADD_PAYMENT_INFO_CANONICAL_ENABLED: 'TRUE',
      SHOPIFY_ADD_PAYMENT_INFO_CUTOVER_AT:
        '2026-08-04T10:00:00.000Z'
    }),
    { enabled: false }
  )
})

test('requires an explicit ISO cutover when activation is enabled', () => {
  assert.throws(
    () =>
      readShopifyAddPaymentInfoCanonicalConfig({
        SHOPIFY_ADD_PAYMENT_INFO_CANONICAL_ENABLED: 'true'
      }),
    /cutoverAt/
  )
})

test('accepts the exact activation pair', () => {
  assert.deepEqual(
    readShopifyAddPaymentInfoCanonicalConfig({
      SHOPIFY_ADD_PAYMENT_INFO_CANONICAL_ENABLED: 'true',
      SHOPIFY_ADD_PAYMENT_INFO_CUTOVER_AT:
        '2026-08-04T10:00:00.000Z'
    }),
    {
      enabled: true,
      cutoverAt: '2026-08-04T10:00:00.000Z'
    }
  )
})
