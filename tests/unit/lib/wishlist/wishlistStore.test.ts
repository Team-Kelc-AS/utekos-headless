import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addWishlistItem,
  hasWishlistVariant,
  readWishlistState,
  type StorageLike
} from '@/lib/wishlist/wishlistStore'

function createMemoryStorage(
  initial: Record<string, string> = {}
): StorageLike {
  const data = { ...initial }
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

test('addWishlistItem persists a new mutation and is idempotent per variant', () => {
  const storage = createMemoryStorage()
  const first = addWishlistItem({
    storage,
    productId: 'gid://shopify/Product/456',
    variantId: 'gid://shopify/ProductVariant/123',
    productHandle: 'utekos-techdown',
    now: () => '2026-07-24T01:00:00.000Z',
    randomId: () => 'mutation-1'
  })

  assert.ok(first)
  assert.equal(first.added, true)
  assert.equal(first.mutationId, 'mutation-1')
  assert.equal(hasWishlistVariant('gid://shopify/ProductVariant/123', storage), true)

  const second = addWishlistItem({
    storage,
    productId: 'gid://shopify/Product/456',
    variantId: 'gid://shopify/ProductVariant/123',
    randomId: () => 'mutation-2'
  })

  assert.ok(second)
  assert.equal(second.added, false)
  assert.equal(second.mutationId, 'mutation-1')
  assert.equal(readWishlistState(storage).entries.length, 1)
})

test('addWishlistItem returns null when storage write fails', () => {
  const storage: StorageLike = {
    getItem() {
      return null
    },
    setItem() {
      throw new Error('quota exceeded')
    }
  }
  const result = addWishlistItem({
    storage,
    productId: 'gid://shopify/Product/456',
    variantId: 'gid://shopify/ProductVariant/123'
  })
  assert.equal(result, null)
})
