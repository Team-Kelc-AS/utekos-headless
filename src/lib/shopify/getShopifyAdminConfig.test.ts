import assert from 'node:assert/strict'
import test from 'node:test'

import { getShopifyAdminConfig } from './getShopifyAdminConfig'

test('keeps Shopify Admin credentials optional at module import', async () => {
  const originalToken = process.env.SHOPIFY_ADMIN_API_TOKEN
  const originalDomain = process.env.SHOPIFY_STORE_DOMAIN

  try {
    delete process.env.SHOPIFY_ADMIN_API_TOKEN
    delete process.env.SHOPIFY_STORE_DOMAIN

    await assert.doesNotReject(() => import('./admin'))
  } finally {
    if (originalToken === undefined) {
      delete process.env.SHOPIFY_ADMIN_API_TOKEN
    } else {
      process.env.SHOPIFY_ADMIN_API_TOKEN = originalToken
    }

    if (originalDomain === undefined) {
      delete process.env.SHOPIFY_STORE_DOMAIN
    } else {
      process.env.SHOPIFY_STORE_DOMAIN = originalDomain
    }
  }
})

test('fails closed when Shopify Admin credentials are used but absent', () => {
  assert.throws(
    () => getShopifyAdminConfig({}),
    /Missing Shopify Admin API credentials/
  )
})

test('returns request configuration when both credentials exist', () => {
  assert.deepEqual(
    getShopifyAdminConfig({
      SHOPIFY_ADMIN_API_TOKEN: 'test-token',
      SHOPIFY_STORE_DOMAIN: 'test-shop.myshopify.com'
    }),
    {
      accessToken: 'test-token',
      graphqlUrl:
        'https://test-shop.myshopify.com/admin/api/2026-04/graphql.json'
    }
  )
})
