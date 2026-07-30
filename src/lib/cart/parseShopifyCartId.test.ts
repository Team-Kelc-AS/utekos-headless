import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseShopifyCartId,
  parseShopifyPublicCartId,
  resolveFullShopifyCartId
} from './parseShopifyCartId'

const fullId =
  'gid://shopify/Cart/opaque-token.v2:%2Ffuture?key=opaque-secret'
const publicId = 'gid://shopify/Cart/opaque-token.v2:%2Ffuture'

test('splits an opaque full cart id into server and public identities', () => {
  assert.deepEqual(parseShopifyCartId(fullId), {
    fullId,
    publicId
  })
  assert.equal(parseShopifyPublicCartId(publicId), publicId)
  assert.equal(
    resolveFullShopifyCartId(publicId, fullId),
    fullId
  )
})

test('rejects missing, duplicate, extra, or empty key parameters', () => {
  for (const value of [
    publicId,
    `${publicId}?key=`,
    `${publicId}?key=secret&key=again`,
    `${publicId}?key=secret&other=value`
  ]) {
    assert.equal(parseShopifyCartId(value), null)
  }
})

test('rejects whitespace, authority credentials, ports, extra paths, and fragments', () => {
  for (const value of [
    ` ${fullId}`,
    `${publicId}%20?key=secret`,
    'gid://user@shopify/Cart/token?key=secret',
    'gid://user:password@shopify/Cart/token?key=secret',
    'gid://shopify:443/Cart/token?key=secret',
    'gid://shopify/Cart/token/extra?key=secret',
    'gid://shopify/Cart/token?key=secret#fragment'
  ]) {
    assert.equal(parseShopifyCartId(value), null)
  }
})

test('rejects noncanonical and mismatched public identities', () => {
  assert.equal(
    parseShopifyCartId('gid://SHOPIFY/Cart/token?key=secret'),
    null
  )
  assert.equal(
    parseShopifyCartId(
      'gid://shopify/ProductVariant/token?key=secret'
    ),
    null
  )
  assert.equal(
    parseShopifyCartId(
      `gid://shopify/Cart/${'a'.repeat(4096)}?key=secret`
    ),
    null
  )
  assert.equal(
    resolveFullShopifyCartId('gid://shopify/Cart/other', fullId),
    null
  )
})
