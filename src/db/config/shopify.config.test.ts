import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SHOPIFY_STOREFRONT_API_VERSION,
  shopifyConfig
} from './shopify.config'

test('pins the Storefront API version to 2026-07', () => {
  assert.equal(SHOPIFY_STOREFRONT_API_VERSION, '2026-07')
  assert.equal(shopifyConfig.apiVersion, '2026-07')
})
