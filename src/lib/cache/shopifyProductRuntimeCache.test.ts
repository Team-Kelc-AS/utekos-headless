import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { RuntimeCache } from '@vercel/functions'
import type { ShopifyProduct } from 'types/product'

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
  getRuntimeCachedShopifyProduct,
  getShopifyProductRuntimeCacheKey,
  SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE,
  SHOPIFY_PRODUCT_RUNTIME_CACHE_TTL_SECONDS
} = require('./shopifyProductRuntimeCache.ts') as typeof import('./shopifyProductRuntimeCache')

class FakeRuntimeCache implements RuntimeCache {
  values = new Map<string, unknown>()
  tags = new Map<string, Set<string>>()
  lastSetOptions: { tags?: string[]; ttl?: number } | undefined

  async get(key: string) {
    return this.values.get(key) ?? null
  }

  async set(key: string, value: unknown, options?: { tags?: string[]; ttl?: number }) {
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

function createProduct(handle = 'utekos-techdown'): ShopifyProduct {
  return {
    id: 'gid://shopify/Product/123',
    title: 'Utekos TechDown',
    handle,
    vendor: 'Utekos',
    updatedAt: '2026-07-15T00:00:00Z',
    availableForSale: true,
    tags: [],
    priceRange: {
      minVariantPrice: { amount: '1790.00', currencyCode: 'NOK' },
      maxVariantPrice: { amount: '1790.00', currencyCode: 'NOK' }
    },
    images: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductImage/789',
            image: {
              id: 'gid://shopify/ProductImage/789',
              url: 'https://cdn.shopify.com/product.jpg',
              altText: 'Utekos TechDown',
              width: 1200,
              height: 1500
            }
          }
        }
      ]
    },
    options: [],
    variants: { edges: [] }
  } as unknown as ShopifyProduct
}

test('uses the v2 namespace for the enriched product payload', () => {
  assert.equal(SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE, 'shopify-catalog:v2')
})

test('replaces a legacy cache hit without variant tax data', async () => {
  const cache = new FakeRuntimeCache()
  const key = getShopifyProductRuntimeCacheKey('utekos-techdown')
  const legacyProduct = createProduct() as unknown as {
    variants: { edges: Array<{ node: Record<string, unknown> }> }
  }
  legacyProduct.variants.edges = [{
    node: {
      availableForSale: true,
      id: 'gid://shopify/ProductVariant/456',
      price: { amount: '1790.00', currencyCode: 'NOK' },
      title: 'Middels'
    }
  }]
  cache.values.set(key, legacyProduct)

  const freshProduct = createProduct() as unknown as {
    variants: { edges: Array<{ node: Record<string, unknown> }> }
  }
  freshProduct.variants.edges = [{
    node: {
      availableForSale: true,
      id: 'gid://shopify/ProductVariant/456',
      price: { amount: '1790.00', currencyCode: 'NOK' },
      taxable: true,
      title: 'Middels'
    }
  }]

  let fetchCount = 0
  const result = await getRuntimeCachedShopifyProduct(
    'utekos-techdown',
    async () => {
      fetchCount += 1
      return freshProduct as unknown as ShopifyProduct
    },
    cache
  )

  assert.equal(fetchCount, 1)
  assert.equal(result?.variants.edges[0]?.node.taxable, true)
})

test('serves miss then hit with the expected key, TTL and tags', async () => {
  const cache = new FakeRuntimeCache()
  let fetchCount = 0
  const fetchProduct = async () => {
    fetchCount += 1
    return createProduct()
  }

  const first = await getRuntimeCachedShopifyProduct(' UTEKOS-TECHDOWN ', fetchProduct, cache)
  const second = await getRuntimeCachedShopifyProduct('utekos-techdown', fetchProduct, cache)

  assert.equal(first?.id, 'gid://shopify/Product/123')
  assert.equal(second?.id, first?.id)
  assert.equal(fetchCount, 1)
  assert.equal(getShopifyProductRuntimeCacheKey(' UTEKOS-TECHDOWN '), 'product:handle:utekos-techdown')
  assert.equal(cache.lastSetOptions?.ttl, SHOPIFY_PRODUCT_RUNTIME_CACHE_TTL_SECONDS)
  assert.deepEqual(cache.lastSetOptions?.tags, [
    'product:123',
    'product-handle:utekos-techdown',
    'catalog'
  ])
})

test('deletes an invalid cache hit and fetches a valid replacement', async () => {
  const cache = new FakeRuntimeCache()
  const key = getShopifyProductRuntimeCacheKey('utekos-techdown')
  cache.values.set(key, { id: 'invalid' })
  let fetchCount = 0

  const product = await getRuntimeCachedShopifyProduct(
    'utekos-techdown',
    async () => {
      fetchCount += 1
      return createProduct()
    },
    cache
  )

  assert.equal(product?.handle, 'utekos-techdown')
  assert.equal(fetchCount, 1)
  assert.equal((await cache.get(key) as { handle: string }).handle, 'utekos-techdown')
})

test('does not cache null products', async () => {
  const cache = new FakeRuntimeCache()
  const product = await getRuntimeCachedShopifyProduct(
    'missing-product',
    async () => null,
    cache
  )

  assert.equal(product, null)
  assert.equal(cache.values.size, 0)
})

test('does not cache fetch failures', async () => {
  const cache = new FakeRuntimeCache()

  await assert.rejects(
    getRuntimeCachedShopifyProduct(
      'utekos-techdown',
      async () => {
        throw new Error('Shopify unavailable')
      },
      cache
    ),
    /Shopify unavailable/
  )

  assert.equal(cache.values.size, 0)
})

test('does not cache products near the two megabyte item limit', async () => {
  const cache = new FakeRuntimeCache()
  const largeProduct = createProduct()
  largeProduct.title = 'x'.repeat(1_900_000)

  const product = await getRuntimeCachedShopifyProduct(
    largeProduct.handle,
    async () => largeProduct,
    cache
  )

  assert.equal(product?.id, largeProduct.id)
  assert.equal(cache.values.size, 0)
})
