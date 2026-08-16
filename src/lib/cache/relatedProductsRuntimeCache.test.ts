import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { RuntimeCache } from '@vercel/functions'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const {
  getRelatedProductsRuntimeCacheKey,
  getRelatedProductsRuntimeCacheTags,
  getRelatedProductsSnapshot,
  setRelatedProductsSnapshot
} = require('./relatedProductsRuntimeCache.ts') as typeof import('./relatedProductsRuntimeCache')
const { RELATED_PRODUCTS_RUNTIME_CACHE_TTL_SECONDS } =
  require('../../api/lib/products/relatedProductsPolicy.ts') as typeof import('../../api/lib/products/relatedProductsPolicy')

class FakeRuntimeCache implements RuntimeCache {
  values = new Map<string, unknown>()
  tags = new Map<string, Set<string>>()
  lastSetOptions: { tags?: string[]; ttl?: number; name?: string } | undefined

  async get(key: string) {
    return this.values.get(key) ?? null
  }

  async set(
    key: string,
    value: unknown,
    options?: { tags?: string[]; ttl?: number; name?: string }
  ) {
    this.values.set(key, value)
    this.lastSetOptions = options
    for (const tag of options?.tags ?? []) {
      const keys = this.tags.get(tag) ?? new Set<string>()
      keys.add(key)
      this.tags.set(tag, keys)
    }
  }

  async delete(key: string) {
    this.values.delete(key)
  }

  async expireTag(tags: string | string[]) {
    for (const tag of Array.isArray(tags) ? tags : [tags]) {
      for (const key of this.tags.get(tag) ?? []) this.values.delete(key)
    }
  }
}

function createCard(handle: string): ProductCardModel {
  return {
    id: `gid://shopify/Product/${handle}`,
    title: handle,
    handle,
    productType: 'Comfyrobe',
    vendor: 'Utekos',
    featuredImage: null,
    collections: { nodes: [] },
    priceRange: {
      minVariantPrice: { amount: '1790.00', currencyCode: 'NOK' }
    },
    options: [],
    variants: { edges: [] }
  }
}

test('stores last-good related products with catalog and related-products tags', async () => {
  const cache = new FakeRuntimeCache()
  const card = createCard('utekos-mikrofiber')

  await setRelatedProductsSnapshot('utekos-techdown', [card], cache)
  const snapshot = await getRelatedProductsSnapshot('utekos-techdown', cache)

  assert.equal(snapshot?.[0]?.handle, 'utekos-mikrofiber')
  assert.equal(
    getRelatedProductsRuntimeCacheKey(' UTEKOS-TECHDOWN '),
    'related-products:handle:utekos-techdown'
  )
  assert.equal(
    cache.lastSetOptions?.ttl,
    RELATED_PRODUCTS_RUNTIME_CACHE_TTL_SECONDS
  )
  assert.deepEqual(
    cache.lastSetOptions?.tags,
    getRelatedProductsRuntimeCacheTags('utekos-techdown')
  )
})

test('expires last-good related products when the related-products tag is expired', async () => {
  const cache = new FakeRuntimeCache()
  await setRelatedProductsSnapshot(
    'utekos-techdown',
    [createCard('utekos-mikrofiber')],
    cache
  )

  await cache.expireTag('related-products')

  assert.equal(
    await getRelatedProductsSnapshot('utekos-techdown', cache),
    null
  )
})
