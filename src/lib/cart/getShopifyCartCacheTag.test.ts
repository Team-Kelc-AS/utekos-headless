import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getShopifyCartCacheTag,
  getShopifyCartLogReference
} from './getShopifyCartCacheTag'

const fullId =
  'gid://shopify/Cart/opaque-token?key=never-log-this-secret'

test('uses stable hashed cache and log identifiers without cart secrets', () => {
  const cacheTag = getShopifyCartCacheTag(fullId)
  const logReference = getShopifyCartLogReference(fullId)

  assert.equal(cacheTag, getShopifyCartCacheTag(fullId))
  assert.match(cacheTag, /^cart-[a-f0-9]{64}$/)
  assert.match(logReference, /^cart:[a-f0-9]{12}$/)
  assert.equal(cacheTag.includes('never-log-this-secret'), false)
  assert.equal(logReference.includes('opaque-token'), false)
})
