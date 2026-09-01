import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveShopifyCustomerPrivacyPublicToken } from './resolveShopifyCustomerPrivacyPublicToken'

test('reads and trims the canonical public Storefront token', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN:
        '  verified-public-token  '
    }),
    'verified-public-token'
  )
})

test('does not recognize legacy Storefront token aliases', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      NEXT_PUBLIC_STOREFRONT_API_ACCESS_TOKEN:
        'legacy-browser-token',
      SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'legacy-token',
      STOREFRONT_API_ACCESS_TOKEN: 'legacy-server-token',
      VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
        'legacy-integration-token'
    }),
    undefined
  )
})

test('treats an empty canonical token as unavailable', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN: '   '
    }),
    undefined
  )
})
