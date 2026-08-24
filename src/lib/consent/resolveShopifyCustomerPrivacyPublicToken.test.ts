import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveShopifyCustomerPrivacyPublicToken } from './resolveShopifyCustomerPrivacyPublicToken'

test('prefers the verified public Storefront token', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      STOREFRONT_API_ACCESS_TOKEN: '  verified-public-token  ',
      VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
        'invalid-integration-token'
    }),
    'verified-public-token'
  )
})

test('falls back to the Vercel integration token', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
        '  integration-public-token  '
    }),
    'integration-public-token'
  )
})

test('fails closed instead of exposing browser or legacy token aliases', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      NEXT_PUBLIC_STOREFRONT_API_ACCESS_TOKEN:
        'invalid-browser-token',
      SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'legacy-token'
    }),
    undefined
  )
})

test('treats an empty integration token as unavailable', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN: '   '
    }),
    undefined
  )
})
