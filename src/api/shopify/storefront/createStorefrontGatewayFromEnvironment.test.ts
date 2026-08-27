import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStorefrontGatewayConfigFromEnvironment } from './createStorefrontGatewayFromEnvironment'

test('prefers the explicitly configured server Storefront token', () => {
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
    publicStorefrontToken: 'fallback-storefront-token'
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

test('does not read a deprecated browser Storefront alias as a server credential', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    NEXT_PUBLIC_STOREFRONT_API_ACCESS_TOKEN:
      'browser-storefront-token'
  })

  assert.equal(config.publicStorefrontToken, undefined)
  assert.equal('privateStorefrontToken' in config, false)
})

test('uses the Headless public token as a last-resort public credential', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN: '  headless-public-token  '
  })

  assert.equal(config.publicStorefrontToken, 'headless-public-token')
  assert.equal('privateStorefrontToken' in config, false)
})

test('maps the Headless private Storefront token from environment', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    STOREFRONT_API_ACCESS_TOKEN: 'public-storefront-token',
    STOREFRONT_API_PRIVATE_ACCESS_TOKEN: 'shpss_headless-private-token'
  })

  assert.deepEqual(config, {
    storeDomain: 'example.myshopify.com',
    storefrontApiVersion: '2026-04',
    publicStorefrontToken: 'public-storefront-token',
    privateStorefrontToken: 'shpss_headless-private-token'
  })
})

test('prefers PRIVATE_STOREFRONT_ACCESS_TOKEN over other private aliases', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    STOREFRONT_API_ACCESS_TOKEN: 'public-storefront-token',
    PRIVATE_STOREFRONT_ACCESS_TOKEN: 'shpss_preferred-private-token',
    STOREFRONT_API_PRIVATE_ACCESS_TOKEN: 'shpss_alias-private-token',
    PRIVATE_STOREFRONT_API_TOKEN: 'shpss_hydrogen-private-token'
  })

  assert.equal(
    config.privateStorefrontToken,
    'shpss_preferred-private-token'
  )
})

test('does not send an Admin API token as a Storefront private credential', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    STOREFRONT_API_ACCESS_TOKEN: 'public-storefront-token',
    PRIVATE_STOREFRONT_ACCESS_TOKEN: 'shpat_admin-token',
    STOREFRONT_API_PRIVATE_ACCESS_TOKEN: 'shpss_headless-private-token',
    STOREFRONT_PRIVATE_ACCESS_TOKEN: 'shpat_misnamed-admin-token'
  })

  assert.equal(
    config.privateStorefrontToken,
    'shpss_headless-private-token'
  )
})

test('does not treat a public browser token as a private credential', () => {
  const config = buildStorefrontGatewayConfigFromEnvironment({
    STORE_DOMAIN: 'example.myshopify.com',
    NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN: 'headless-public-token'
  })

  assert.equal(config.publicStorefrontToken, 'headless-public-token')
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
