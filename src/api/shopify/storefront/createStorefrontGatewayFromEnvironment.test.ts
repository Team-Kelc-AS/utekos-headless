import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStorefrontGatewayConfigFromEnvironment } from './createStorefrontGatewayFromEnvironment'

test('builds the gateway from the canonical Storefront variables', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'https://integration.myshopify.com/path',
    NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN:
      ' public-storefront-token ',
    STOREFRONT_PRIVATE_ACCESS_TOKEN:
      ' private-storefront-token '
  })

  assert.deepEqual(config, {
    storeDomain: 'integration.myshopify.com',
    storefrontApiVersion: '2026-04',
    publicStorefrontToken: 'public-storefront-token',
    privateStorefrontToken: 'private-storefront-token'
  })
})

test('does not recognize legacy Storefront token aliases', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    STOREFRONT_API_ACCESS_TOKEN: 'legacy-public-token',
    STOREFRONT_API_PRIVATE_ACCESS_TOKEN: 'legacy-private-token',
    PRIVATE_STOREFRONT_API_TOKEN: 'hydrogen-private-token',
    VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
      'integration-public-token'
  })

  assert.equal(config.publicStorefrontToken, undefined)
  assert.equal('privateStorefrontToken' in config, false)
})

test('omits empty canonical Storefront tokens', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN: '   ',
    STOREFRONT_PRIVATE_ACCESS_TOKEN: ''
  })

  assert.equal(config.publicStorefrontToken, undefined)
  assert.equal('privateStorefrontToken' in config, false)
})

test('fails closed when STORE_DOMAIN is absent', () => {
  assert.throws(
    () =>
      buildStorefrontGatewayConfigFromEnvironment({
        NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN: 'storefront-token'
      }),
    /STORE_DOMAIN is not defined/
  )
})
