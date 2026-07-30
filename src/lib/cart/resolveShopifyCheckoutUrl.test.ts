import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveShopifyCheckoutUrl } from './resolveShopifyCheckoutUrl'

test('accepts the configured custom checkout host without exposing it to cart state', () => {
  const result = resolveShopifyCheckoutUrl(
    'https://kasse.utekos.no/cart/c/token?key=secret',
    'utekos.myshopify.com'
  )

  assert.equal(
    result?.toString(),
    'https://kasse.utekos.no/cart/c/token?key=secret'
  )
})

test('accepts the configured Shopify store host', () => {
  const result = resolveShopifyCheckoutUrl(
    'https://utekos.myshopify.com/cart/c/token?key=secret',
    'utekos.myshopify.com'
  )

  assert.equal(result?.hostname, 'utekos.myshopify.com')
})

test('rejects untrusted, credentialed, non-TLS, and non-cart URLs', () => {
  const invalidUrls = [
    'https://example.com/cart/c/token?key=secret',
    'https://user:pass@kasse.utekos.no/cart/c/token?key=secret',
    'http://kasse.utekos.no/cart/c/token?key=secret',
    'https://kasse.utekos.no/orders/token?key=secret',
    'https://kasse.utekos.no:444/cart/c/token?key=secret',
    'https://kasse.utekos.no/cart/c/token?key=secret#fragment'
  ]

  for (const value of invalidUrls) {
    assert.equal(
      resolveShopifyCheckoutUrl(value, 'utekos.myshopify.com'),
      null
    )
  }
})
