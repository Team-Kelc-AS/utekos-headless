import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStorefrontGatewayConfigFromEnvironment } from './createStorefrontGatewayFromEnvironment'

test('prefers the Vercel Shopify integration credentials', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    VERCEL_SHOPIFY_STORE_DOMAIN:
      'https://integration.myshopify.com/path',
    VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
      'integration-storefront-token',
    STORE_DOMAIN: 'fallback.myshopify.com',
    STOREFRONT_API_ACCESS_TOKEN: 'fallback-storefront-token'
  })

  assert.deepEqual(config, {
    storeDomain: 'integration.myshopify.com',
    storefrontApiVersion: '2026-04',
    publicStorefrontToken: 'integration-storefront-token'
  })
  assert.equal('privateStorefrontToken' in config, false)
})

test('uses the server-only fallback when integration values are empty', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    VERCEL_SHOPIFY_STORE_DOMAIN: '   ',
    VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN: '',
    STORE_DOMAIN: 'fallback.myshopify.com',
    STOREFRONT_API_ACCESS_TOKEN: 'fallback-storefront-token'
  })

  assert.deepEqual(config, {
    storeDomain: 'fallback.myshopify.com',
    storefrontApiVersion: '2026-04',
    publicStorefrontToken: 'fallback-storefront-token'
  })
  assert.equal('privateStorefrontToken' in config, false)
})

test('does not read a browser Storefront token as a server credential', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    NEXT_PUBLIC_STOREFRONT_API_ACCESS_TOKEN:
      'browser-storefront-token'
  })

  assert.equal(config.publicStorefrontToken, undefined)
  assert.equal('privateStorefrontToken' in config, false)
})

test('fails closed when STORE_DOMAIN is absent', () => {
  assert.throws(
    () =>
      buildStorefrontGatewayConfigFromEnvironment({
        STOREFRONT_API_ACCESS_TOKEN: 'storefront-token'
      }),
    /STORE_DOMAIN is not defined/
  )
})
