import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveShopifyCustomerPrivacyPublicToken } from './resolveShopifyCustomerPrivacyPublicToken'

test('uses the verified Vercel Shopify public Storefront token', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
        '  public-storefront-token  '
    }),
    'public-storefront-token'
  )
})

test('fails closed instead of exposing unrelated Storefront token aliases', () => {
  assert.equal(
    resolveShopifyCustomerPrivacyPublicToken({
      NEXT_PUBLIC_STOREFRONT_API_ACCESS_TOKEN:
        'invalid-browser-token',
      STOREFRONT_API_ACCESS_TOKEN: 'server-only-token',
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
