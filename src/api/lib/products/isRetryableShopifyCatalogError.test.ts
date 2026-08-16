import assert from 'node:assert/strict'
import test from 'node:test'
import { ShopifyCatalogGraphQLError } from './ShopifyCatalogGraphQLError'
import { isRetryableShopifyCatalogError } from './isRetryableShopifyCatalogError'

test('retries timeout and network failures', () => {
  assert.equal(
    isRetryableShopifyCatalogError(
      new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError'
      )
    ),
    true
  )
  assert.equal(
    isRetryableShopifyCatalogError(
      Object.assign(new TypeError('fetch failed'), { name: 'TypeError' })
    ),
    true
  )
})

test('does not retry GraphQL validation errors', () => {
  assert.equal(
    isRetryableShopifyCatalogError(
      new ShopifyCatalogGraphQLError(
        'Field is not defined on Product',
        'GRAPHQL_VALIDATION_FAILED'
      )
    ),
    false
  )
})
