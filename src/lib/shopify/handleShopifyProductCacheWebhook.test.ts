import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import type { RuntimeCache } from '@vercel/functions'
import {
  getRuntimeCachedShopifyProduct,
  getShopifyProductLastGoodRuntimeCacheKey,
  getShopifyProductRuntimeCacheKey
} from '@/lib/cache/shopifyProductRuntimeCache'
import { revalidateProductCatalog } from '@/lib/cache/revalidateProductCatalog'
import { handleShopifyProductCacheWebhook } from './handleShopifyProductCacheWebhook'
import type { ShopifyProduct } from 'types/product'

class TaggedRuntimeCache implements RuntimeCache {
  values = new Map<string, unknown>()
  tags = new Map<string, Set<string>>()

  async get(key: string) {
    return this.values.get(key) ?? null
  }

  async set(
    key: string,
    value: unknown,
    options?: { tags?: string[] }
  ) {
    this.values.set(key, value)
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

function createProduct(): ShopifyProduct {
  return {
    id: 'gid://shopify/Product/123',
    title: 'Utekos TechDown',
    handle: 'utekos-techdown',
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
    images: { edges: [] },
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

test('signed product update revalidates fresh data while preserving last-good', async () => {
  const previousSecret = process.env.SHOPIFY_WEBHOOK_SECRET
  process.env.SHOPIFY_WEBHOOK_SECRET = 'test-webhook-secret'

  try {
    const cache = new TaggedRuntimeCache()
    let fetchCount = 0
    const fetchProduct = async () => {
      fetchCount += 1
      return createProduct()
    }

    await getRuntimeCachedShopifyProduct(
      'utekos-techdown',
      fetchProduct,
      cache
    )
    await getRuntimeCachedShopifyProduct(
      'utekos-techdown',
      fetchProduct,
      cache
    )
    assert.equal(fetchCount, 1)

    const body = JSON.stringify({
      id: 123,
      handle: 'utekos-techdown'
    })
    const signature = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('base64')
    const revalidatedNextTags: Array<{
      profile: unknown
      tag: string
    }> = []

    const response = await handleShopifyProductCacheWebhook(
      new Request(
        'https://utekos.no/api/shopify/webhooks/products-update',
        {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-shopify-hmac-sha256': signature,
            'x-shopify-topic': 'products/update'
          }
        }
      ),
      'products/update',
      {
        invalidateProductCatalog: (
          handles,
          productIds,
          options
        ) =>
          revalidateProductCatalog(
            handles,
            productIds,
            options,
            {
              runtimeCache: cache,
              revalidateNextTag: (tag, profile) => {
                revalidatedNextTags.push({ tag, profile })
              }
            }
          )
      }
    )

    assert.equal(response.status, 200)
    assert.deepEqual(
      revalidatedNextTags.map(({ tag }) => tag),
      [
        'products',
        'product-utekos-techdown',
        'related-products-utekos-techdown'
      ]
    )
    assert.deepEqual(
      revalidatedNextTags.map(({ profile }) => profile),
      ['max', 'max', 'max']
    )
    const responseBody = (await response.json()) as {
      invalidatedTags: { runtimeTags: string[] }
    }
    assert.deepEqual(responseBody.invalidatedTags.runtimeTags, [
      'product-handle:utekos-techdown',
      'product:123'
    ])
    assert.equal(
      await cache.get(
        getShopifyProductRuntimeCacheKey('utekos-techdown')
      ),
      null
    )
    assert.notEqual(
      await cache.get(
        getShopifyProductLastGoodRuntimeCacheKey(
          'utekos-techdown'
        )
      ),
      null
    )

    const fallbackProduct = await getRuntimeCachedShopifyProduct(
      'utekos-techdown',
      async () => {
        throw new DOMException(
          'Shopify request timed out',
          'TimeoutError'
        )
      },
      cache
    )
    assert.equal(
      fallbackProduct?.id,
      'gid://shopify/Product/123'
    )
    assert.equal(fetchCount, 1)
  } finally {
    if (previousSecret === undefined)
      delete process.env.SHOPIFY_WEBHOOK_SECRET
    else process.env.SHOPIFY_WEBHOOK_SECRET = previousSecret
  }
})

test('signed product delete purges the product last-good snapshot', async () => {
  const previousSecret = process.env.SHOPIFY_WEBHOOK_SECRET
  process.env.SHOPIFY_WEBHOOK_SECRET = 'test-webhook-secret'

  try {
    const cache = new TaggedRuntimeCache()
    const product = createProduct()
    const revalidatedNextTags: Array<{
      profile: unknown
      tag: string
    }> = []
    await getRuntimeCachedShopifyProduct(
      product.handle,
      async () => product,
      cache
    )

    const body = JSON.stringify({
      id: 123,
      handle: product.handle
    })
    const signature = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('base64')

    const response = await handleShopifyProductCacheWebhook(
      new Request(
        'https://utekos.no/api/shopify/webhooks/products-delete',
        {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'x-shopify-hmac-sha256': signature,
            'x-shopify-topic': 'products/delete'
          }
        }
      ),
      'products/delete',
      {
        invalidateProductCatalog: (
          handles,
          productIds,
          options
        ) =>
          revalidateProductCatalog(
            handles,
            productIds,
            options,
            {
              runtimeCache: cache,
              revalidateNextTag: (tag, profile) => {
                revalidatedNextTags.push({ tag, profile })
              }
            }
          )
      }
    )

    assert.equal(response.status, 200)
    assert.deepEqual(
      revalidatedNextTags.map(({ profile }) => profile),
      ['seconds', 'seconds', 'seconds']
    )
    assert.equal(
      await cache.get(
        getShopifyProductLastGoodRuntimeCacheKey(product.handle)
      ),
      null
    )
  } finally {
    if (previousSecret === undefined)
      delete process.env.SHOPIFY_WEBHOOK_SECRET
    else process.env.SHOPIFY_WEBHOOK_SECRET = previousSecret
  }
})
