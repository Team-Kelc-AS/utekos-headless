import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { RuntimeCache } from '@vercel/functions'
import { ShopifyStorefrontHttpError } from '@/api/shopify/request/ShopifyStorefrontHttpError'
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
  fetchShopifyProductWithFallback,
  fetchShopifyProductsWithFallback,
  getShopifyProductLastGoodRuntimeCacheKey,
  SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE,
  SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS,
  SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE
} =
  require('./shopifyProductRuntimeCache.ts') as typeof import('./shopifyProductRuntimeCache')

class FakeRuntimeCache implements RuntimeCache {
  values = new Map<string, unknown>()
  tags = new Map<string, Set<string>>()
  setOptions = new Map<
    string,
    { tags?: string[]; ttl?: number }
  >()
  setCounts = new Map<string, number>()

  async get(key: string) {
    return this.values.get(key) ?? null
  }

  async set(
    key: string,
    value: unknown,
    options?: { tags?: string[]; ttl?: number }
  ) {
    this.values.set(key, value)
    this.setOptions.set(key, options ?? {})
    this.setCounts.set(key, (this.setCounts.get(key) ?? 0) + 1)
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
      for (const key of this.tags.get(tag) ?? [])
        this.values.delete(key)
    }
  }
}

function createProduct(
  handle = 'utekos-techdown'
): ShopifyProduct {
  return {
    id: 'gid://shopify/Product/123',
    title: 'Utekos TechDown',
    handle,
    productType: 'Yttertøy',
    totalInventory: 10,
    vendor: 'Utekos',
    updatedAt: '2026-07-15T00:00:00Z',
    collections: { nodes: [] },
    compareAtPriceRange: {
      minVariantPrice: {
        amount: '1990.00',
        currencyCode: 'NOK'
      },
      maxVariantPrice: { amount: '1990.00', currencyCode: 'NOK' }
    },
    availableForSale: true,
    tags: [],
    priceRange: {
      minVariantPrice: {
        amount: '1790.00',
        currencyCode: 'NOK'
      },
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
    description: null,
    featuredImage: {
      id: 'gid://shopify/ProductImage/789',
      url: 'https://cdn.shopify.com/product.jpg',
      altText: 'Utekos TechDown',
      width: 1200,
      height: 1500
    },
    relatedProducts: [],
    category: null,
    variantProfile: null,
    seo: { title: null, description: null },
    variants: { edges: [] }
  } as unknown as ShopifyProduct
}

test('keeps the compatible fallback namespace', () => {
  assert.equal(
    SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE,
    'shopify-catalog:v2'
  )
})

test('always fetches the source on a Next cache miss and stores only a fallback', async () => {
  const cache = new FakeRuntimeCache()
  const handles: string[] = []
  cache.get = async () => {
    throw new Error('healthy fetches must not read the fallback')
  }
  const fetchProduct = async (handle: string) => {
    handles.push(handle)
    return {
      ...createProduct(handle),
      totalInventory: handles.length
    }
  }
  const first = await fetchShopifyProductWithFallback(
    ' UTEKOS-TECHDOWN ',
    fetchProduct,
    cache
  )
  const second = await fetchShopifyProductWithFallback(
    'utekos-techdown',
    fetchProduct,
    cache
  )
  assert.deepEqual(handles, [
    'utekos-techdown',
    'utekos-techdown'
  ])
  assert.equal(first.data?.totalInventory, 1)
  assert.equal(second.data?.totalInventory, 2)
  assert.equal(second.isFallback, false)
  const key = getShopifyProductLastGoodRuntimeCacheKey(
    'utekos-techdown'
  )
  assert.deepEqual([...cache.values.keys()], [key])
  assert.equal(
    cache.setOptions.get(key)?.ttl,
    SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS
  )
  assert.deepEqual(cache.setOptions.get(key)?.tags, [
    'product-last-good',
    'product-last-good:123',
    'product-last-good-handle:utekos-techdown'
  ])
})

test('serves a validated snapshot after timeout without renewing its age', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  await fetchShopifyProductWithFallback(
    product.handle,
    async () => product,
    cache
  )
  const key = getShopifyProductLastGoodRuntimeCacheKey(
    product.handle
  )
  const snapshot = cache.values.get(key)
  const result = await fetchShopifyProductWithFallback(
    product.handle,
    async () => {
      throw new DOMException('Shopify timed out', 'TimeoutError')
    },
    cache
  )
  assert.deepEqual(result, { data: product, isFallback: true })
  assert.equal(cache.values.get(key), snapshot)
  assert.equal(cache.setCounts.get(key), 1)
})

test('does not mask a query or authentication error with a snapshot', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  await fetchShopifyProductWithFallback(
    product.handle,
    async () => product,
    cache
  )
  for (const error of [
    new Error('Invalid product query'),
    new ShopifyStorefrontHttpError(401)
  ]) {
    await assert.rejects(
      fetchShopifyProductWithFallback(
        product.handle,
        async () => {
          throw error
        },
        cache
      ),
      error
    )
  }
})

test('rejects a cold timeout and recovers on the next successful fetch', async () => {
  const cache = new FakeRuntimeCache()
  const error = new DOMException(
    'Shopify timed out',
    'TimeoutError'
  )
  await assert.rejects(
    fetchShopifyProductWithFallback(
      'utekos-techdown',
      async () => {
        throw error
      },
      cache
    ),
    error
  )
  assert.equal(cache.values.size, 0)
  const recovered = await fetchShopifyProductWithFallback(
    'utekos-techdown',
    async () => createProduct(),
    cache
  )
  assert.equal(recovered.data?.handle, 'utekos-techdown')
  assert.equal(recovered.isFallback, false)
})

test('a failed fallback write does not discard a healthy Shopify response', async () => {
  const cache = new FakeRuntimeCache()
  cache.set = async () => {
    throw new Error('Cache unavailable')
  }
  const product = createProduct()
  const result = await fetchShopifyProductWithFallback(
    product.handle,
    async () => product,
    cache
  )
  assert.deepEqual(result, { data: product, isFallback: false })
})

test('a failed fallback read preserves the original backend error', async () => {
  const cache = new FakeRuntimeCache()
  cache.get = async () => {
    throw new Error('Cache unavailable')
  }
  const error = new DOMException(
    'Shopify timed out',
    'TimeoutError'
  )
  await assert.rejects(
    fetchShopifyProductWithFallback(
      'utekos-techdown',
      async () => {
        throw error
      },
      cache
    ),
    error
  )
})

test('rejects incomplete, expired, future-dated and mismatched fallback snapshots', async () => {
  const product = createProduct()
  const now = Date.now()
  const snapshots = [
    {
      cachedAt: new Date(now).toISOString(),
      product: { id: product.id }
    },
    {
      cachedAt: new Date(now - 86_400_000).toISOString(),
      product
    },
    { cachedAt: new Date(now + 60_000).toISOString(), product },
    {
      cachedAt: new Date(now).toISOString(),
      product: createProduct('wrong-product')
    },
    {
      cachedAt: new Date(
        now -
          (86_400 -
            SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE.expire +
            1) *
            1000
      ).toISOString(),
      product
    }
  ]
  for (const snapshot of snapshots) {
    const cache = new FakeRuntimeCache()
    const key = getShopifyProductLastGoodRuntimeCacheKey(
      product.handle
    )
    cache.values.set(key, snapshot)
    const error = new DOMException(
      'Shopify timed out',
      'TimeoutError'
    )
    await assert.rejects(
      fetchShopifyProductWithFallback(
        product.handle,
        async () => {
          throw error
        },
        cache
      ),
      error
    )
    assert.equal(cache.values.has(key), false)
  }
})

test('validates successful product data before replacing the fallback', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  await fetchShopifyProductWithFallback(
    product.handle,
    async () => product,
    cache
  )
  const key = getShopifyProductLastGoodRuntimeCacheKey(
    product.handle
  )
  const snapshot = cache.values.get(key)
  for (const invalid of [
    { id: product.id },
    createProduct('wrong-product')
  ]) {
    await assert.rejects(
      fetchShopifyProductWithFallback(
        product.handle,
        async () => invalid as ShopifyProduct,
        cache
      )
    )
    assert.equal(cache.values.get(key), snapshot)
  }
})

test('an authoritative missing product removes its fallback', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  await fetchShopifyProductWithFallback(
    product.handle,
    async () => product,
    cache
  )
  const result = await fetchShopifyProductWithFallback(
    product.handle,
    async () => null,
    cache
  )
  assert.deepEqual(result, { data: null, isFallback: false })
  assert.equal(cache.values.size, 0)
})

test('does not store products near the two megabyte item limit', async () => {
  const cache = new FakeRuntimeCache()
  const product = {
    ...createProduct(),
    title: 'x'.repeat(1_900_000)
  }
  const result = await fetchShopifyProductWithFallback(
    product.handle,
    async () => product,
    cache
  )
  assert.equal(result.data?.id, product.id)
  assert.equal(cache.values.size, 0)
})

test('fetches unique featured handles in one batch and preserves requested order', async () => {
  const cache = new FakeRuntimeCache()
  const batches: string[][] = []
  const result = await fetchShopifyProductsWithFallback(
    [
      ' UTEKOS-TECHDOWN ',
      'missing-product',
      'comfyrobe',
      'comfyrobe'
    ],
    async handles => {
      batches.push([...handles])
      return [createProduct('comfyrobe'), createProduct()]
    },
    cache
  )
  assert.deepEqual(batches, [
    ['utekos-techdown', 'missing-product', 'comfyrobe']
  ])
  assert.deepEqual(
    result.data.map(p => p.handle),
    ['utekos-techdown', 'comfyrobe']
  )
  assert.equal(result.isFallback, false)
})

test('an authoritative batch removes snapshots of products that disappeared', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  await fetchShopifyProductWithFallback(
    product.handle,
    async () => product,
    cache
  )
  await fetchShopifyProductsWithFallback(
    [product.handle],
    async () => [],
    cache
  )
  assert.equal(cache.values.size, 0)
})

test('serves ordered batch fallback after a transient HTTP failure', async () => {
  const cache = new FakeRuntimeCache()
  const handles = ['utekos-techdown', 'comfyrobe']
  await fetchShopifyProductsWithFallback(
    handles,
    async () => handles.map(createProduct),
    cache
  )
  const result = await fetchShopifyProductsWithFallback(
    handles,
    async () => {
      throw new ShopifyStorefrontHttpError(502)
    },
    cache
  )
  assert.deepEqual(
    result.data.map(p => p.handle),
    handles
  )
  assert.equal(result.isFallback, true)
})

test('does not turn a failed empty batch into cached success', async () => {
  const cache = new FakeRuntimeCache()
  const error = new DOMException(
    'Shopify timeout',
    'TimeoutError'
  )
  await assert.rejects(
    fetchShopifyProductsWithFallback(
      ['utekos-techdown'],
      async () => {
        throw error
      },
      cache
    ),
    error
  )
  assert.equal(cache.values.size, 0)
  const result = await fetchShopifyProductsWithFallback(
    ['utekos-techdown'],
    async () => [createProduct()],
    cache
  )
  assert.equal(result.data[0]?.handle, 'utekos-techdown')
  assert.equal(result.isFallback, false)
})
