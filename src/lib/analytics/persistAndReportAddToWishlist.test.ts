import assert from 'node:assert/strict'
import test from 'node:test'
import { persistAndReportAddToWishlist } from './persistAndReportAddToWishlist'
import type { StorageLike } from '@/lib/wishlist/wishlistStore'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

function createMemoryStorage(): StorageLike {
  const data: Record<string, string> = {}
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ?
          data[key]!
        : null
    },
    setItem(key, value) {
      data[key] = value
    }
  }
}

test('does not emit without a variant', () => {
  const result = persistAndReportAddToWishlist({
    product: { id: 'gid://shopify/Product/1', handle: 'x' } as ShopifyProduct,
    variant: null,
    storage: createMemoryStorage()
  })

  assert.deepEqual(result, {
    emitted: false,
    persisted: false,
    alreadyPresent: false
  })
})

test('persists once and marks alreadyPresent on second call without rethrow', () => {
  const storage = createMemoryStorage()
  const product = {
    id: 'gid://shopify/Product/456',
    handle: 'utekos-techdown'
  } as ShopifyProduct
  const variant = {
    id: 'gid://shopify/ProductVariant/123'
  } as ShopifyProductVariant

  // Reporter will fail closed in Node (no window) via queueMicrotask; persistence
  // still succeeds. Assert store semantics without requiring browser GTM.
  const first = persistAndReportAddToWishlist({
    product,
    variant,
    storage
  })
  assert.equal(first.persisted, true)
  assert.equal(first.emitted, false)
  assert.equal(first.alreadyPresent, false)

  const second = persistAndReportAddToWishlist({
    product,
    variant,
    storage
  })
  assert.deepEqual(second, {
    emitted: false,
    persisted: true,
    alreadyPresent: true
  })
})
