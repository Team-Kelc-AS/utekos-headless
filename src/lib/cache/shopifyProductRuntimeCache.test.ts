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
  getRuntimeCachedShopifyProduct,
  getRuntimeCachedShopifyProductsByHandles,
  getShopifyProductLastGoodRuntimeCacheKey,
  getShopifyProductRuntimeCacheKey,
  SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE,
  SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS,
  SHOPIFY_PRODUCT_RUNTIME_CACHE_TTL_SECONDS
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

test('uses the v2 namespace for the enriched product payload', () => {
  assert.equal(
    SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE,
    'shopify-catalog:v2'
  )
})

test('replaces a legacy cache hit without variant tax data', async () => {
  const cache = new FakeRuntimeCache()
  const key = getShopifyProductRuntimeCacheKey('utekos-techdown')
  const legacyProduct = createProduct() as unknown as {
    variants: { edges: Array<{ node: Record<string, unknown> }> }
  }
  legacyProduct.variants.edges = [
    {
      node: {
        availableForSale: true,
        barcode: null,
        compareAtPrice: null,
        currentlyNotInStock: false,
        id: 'gid://shopify/ProductVariant/456',
        image: null,
        metafield: null,
        price: { amount: '1790.00', currencyCode: 'NOK' },
        quantityAvailable: 10,
        selectedOptions: [],
        sku: 'TECHDOWN-M',
        title: 'Middels',
        variantProfile: null,
        weight: null,
        weightUnit: 'GRAMS'
      }
    }
  ]
  cache.values.set(key, legacyProduct)

  const freshProduct = createProduct() as unknown as {
    variants: { edges: Array<{ node: Record<string, unknown> }> }
  }
  freshProduct.variants.edges = [
    {
      node: {
        availableForSale: true,
        barcode: null,
        compareAtPrice: null,
        currentlyNotInStock: false,
        id: 'gid://shopify/ProductVariant/456',
        image: null,
        metafield: null,
        price: { amount: '1790.00', currencyCode: 'NOK' },
        quantityAvailable: 10,
        selectedOptions: [],
        sku: 'TECHDOWN-M',
        taxable: true,
        title: 'Middels',
        variantProfile: null,
        weight: null,
        weightUnit: 'GRAMS'
      }
    }
  ]

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

  const first = await getRuntimeCachedShopifyProduct(
    ' UTEKOS-TECHDOWN ',
    fetchProduct,
    cache
  )
  const second = await getRuntimeCachedShopifyProduct(
    'utekos-techdown',
    fetchProduct,
    cache
  )

  assert.equal(first?.id, 'gid://shopify/Product/123')
  assert.equal(second?.id, first?.id)
  assert.equal(fetchCount, 1)
  assert.equal(
    getShopifyProductRuntimeCacheKey(' UTEKOS-TECHDOWN '),
    'product:handle:utekos-techdown'
  )
  const productCacheKey = getShopifyProductRuntimeCacheKey(
    'utekos-techdown'
  )
  const lastGoodCacheKey =
    getShopifyProductLastGoodRuntimeCacheKey('utekos-techdown')
  assert.equal(
    cache.setOptions.get(productCacheKey)?.ttl,
    SHOPIFY_PRODUCT_RUNTIME_CACHE_TTL_SECONDS
  )
  assert.deepEqual(cache.setOptions.get(productCacheKey)?.tags, [
    'product:123',
    'product-handle:utekos-techdown',
    'catalog'
  ])
  assert.equal(
    cache.setOptions.get(lastGoodCacheKey)?.ttl,
    SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS
  )
  assert.deepEqual(
    cache.setOptions.get(lastGoodCacheKey)?.tags,
    [
      'product-last-good',
      'product-last-good:123',
      'product-last-good-handle:utekos-techdown'
    ]
  )
  assert.equal(
    cache.setCounts.get(lastGoodCacheKey),
    1,
    'a fresh Runtime Cache hit must not extend the last-good snapshot age'
  )
})

test('seeds a missing last-good snapshot from a valid fresh cache entry', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  const lastGoodCacheKey =
    getShopifyProductLastGoodRuntimeCacheKey(product.handle)
  cache.values.set(
    getShopifyProductRuntimeCacheKey(product.handle),
    product
  )

  const result = await getRuntimeCachedShopifyProduct(
    product.handle,
    async () => {
      throw new Error('fresh cache hits must not fetch Shopify')
    },
    cache
  )

  assert.equal(result?.id, product.id)
  assert.notEqual(await cache.get(lastGoodCacheKey), null)
  assert.equal(cache.setCounts.get(lastGoodCacheKey), 1)
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
  assert.equal(
    ((await cache.get(key)) as { handle: string }).handle,
    'utekos-techdown'
  )
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

test('serves a validated last-good product after a retryable timeout', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()

  await getRuntimeCachedShopifyProduct(
    product.handle,
    async () => product,
    cache
  )
  await cache.expireTag(`product-handle:${product.handle}`)

  const result = await getRuntimeCachedShopifyProduct(
    product.handle,
    async () => {
      throw new DOMException(
        'Shopify request timed out',
        'TimeoutError'
      )
    },
    cache
  )

  assert.equal(result?.id, product.id)
  assert.notEqual(
    await cache.get(
      getShopifyProductLastGoodRuntimeCacheKey(product.handle)
    ),
    null
  )
})

test('does not hide non-retryable product fetch errors with last-good data', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()

  await getRuntimeCachedShopifyProduct(
    product.handle,
    async () => product,
    cache
  )
  await cache.expireTag(`product-handle:${product.handle}`)

  await assert.rejects(
    getRuntimeCachedShopifyProduct(
      product.handle,
      async () => {
        throw new Error('Invalid product query')
      },
      cache
    ),
    /Invalid product query/
  )
})

test('never serves a structurally incomplete last-good product', async () => {
  const cache = new FakeRuntimeCache()
  const lastGoodCacheKey =
    getShopifyProductLastGoodRuntimeCacheKey('utekos-techdown')
  cache.values.set(lastGoodCacheKey, {
    cachedAt: new Date().toISOString(),
    product: {
      id: 'gid://shopify/Product/123',
      handle: 'utekos-techdown',
      title: 'Incomplete product'
    }
  })

  await assert.rejects(
    getRuntimeCachedShopifyProduct(
      'utekos-techdown',
      async () => {
        throw new DOMException(
          'Shopify request timed out',
          'TimeoutError'
        )
      },
      cache
    ),
    (error: unknown) =>
      error instanceof DOMException &&
      error.name === 'TimeoutError'
  )
  assert.equal(await cache.get(lastGoodCacheKey), null)
})

test('authoritative missing products remove their last-good snapshot', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  const lastGoodCacheKey =
    getShopifyProductLastGoodRuntimeCacheKey(product.handle)

  await getRuntimeCachedShopifyProduct(
    product.handle,
    async () => product,
    cache
  )
  await cache.expireTag(`product-handle:${product.handle}`)

  const result = await getRuntimeCachedShopifyProduct(
    product.handle,
    async () => null,
    cache
  )

  assert.equal(result, null)
  assert.equal(await cache.get(lastGoodCacheKey), null)
})

test('authoritative batch results remove stale active products that disappeared', async () => {
  const cache = new FakeRuntimeCache()
  const product = createProduct()
  const productCacheKey = getShopifyProductRuntimeCacheKey(
    product.handle
  )

  await getRuntimeCachedShopifyProduct(
    product.handle,
    async () => product,
    cache
  )
  await getRuntimeCachedShopifyProductsByHandles(
    [product.handle],
    async () => [],
    cache
  )

  assert.equal(await cache.get(productCacheKey), null)
  assert.equal(
    await cache.get(
      getShopifyProductLastGoodRuntimeCacheKey(product.handle)
    ),
    null
  )
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

test('fetches featured handles in one batch and preserves requested order', async () => {
  const cache = new FakeRuntimeCache()
  const requestedBatches: string[][] = []

  const products = await getRuntimeCachedShopifyProductsByHandles(
    ['utekos-techdown', 'missing-product', 'comfyrobe'],
    async requestedHandles => {
      requestedBatches.push([...requestedHandles])
      return [
        createProduct('comfyrobe'),
        createProduct('utekos-techdown')
      ]
    },
    cache
  )

  assert.deepEqual(requestedBatches, [
    ['utekos-techdown', 'missing-product', 'comfyrobe']
  ])
  assert.deepEqual(
    products.map(product => product.handle),
    ['utekos-techdown', 'comfyrobe']
  )
})

test('serves ordered batch last-good after a transient Shopify HTTP failure', async () => {
  const cache = new FakeRuntimeCache()
  const handles = ['utekos-techdown', 'comfyrobe'] as const

  await getRuntimeCachedShopifyProductsByHandles(
    handles,
    async () => handles.map(createProduct),
    cache
  )
  await cache.expireTag(
    handles.map(handle => `product-handle:${handle}`)
  )

  let batchAttempts = 0
  const products = await getRuntimeCachedShopifyProductsByHandles(
    handles,
    async () => {
      batchAttempts += 1
      throw new ShopifyStorefrontHttpError(502)
    },
    cache
  )

  assert.equal(batchAttempts, 1)
  assert.deepEqual(
    products.map(product => product.handle),
    [...handles]
  )
})

test('does not turn a failed empty batch into cached success', async () => {
  const cache = new FakeRuntimeCache()
  let batchAttempts = 0

  await assert.rejects(
    getRuntimeCachedShopifyProductsByHandles(
      ['utekos-techdown'],
      async () => {
        batchAttempts += 1
        throw new DOMException('Shopify timeout', 'TimeoutError')
      },
      cache
    ),
    (error: unknown) =>
      error instanceof DOMException && error.name === 'TimeoutError'
  )

  const products = await getRuntimeCachedShopifyProductsByHandles(
    ['utekos-techdown'],
    async () => {
      batchAttempts += 1
      return [createProduct()]
    },
    cache
  )

  assert.equal(batchAttempts, 2)
  assert.equal(products[0]?.handle, 'utekos-techdown')
})
