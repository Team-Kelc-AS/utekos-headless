import 'server-only'

import { getCache, type RuntimeCache } from '@vercel/functions'
import { z } from 'zod'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type { ShopifyProduct } from 'types/product'

export const SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE = 'shopify-catalog:v2'
export const SHOPIFY_PRODUCT_RUNTIME_CACHE_TTL_SECONDS = 900
export const SHOPIFY_PRODUCT_RUNTIME_CACHE_MAX_SAFE_BYTES = 1_900_000

const RUNTIME_CACHE_SPAN_ATTRIBUTES = {
  'cache.system': 'vercel_runtime_cache',
  'cache.namespace': SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE
} as const

const moneySchema = z.looseObject({
  amount: z.string(),
  currencyCode: z.string().min(1)
})

const imageSchema = z.looseObject({
  id: z.string().optional(),
  url: z.string().url(),
  altText: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional()
})

export const shopifyRuntimeCachedProductSchema = z.looseObject({
  id: z.string().min(1),
  title: z.string().min(1),
  handle: z.string().min(1),
  vendor: z.string(),
  updatedAt: z.string().min(1),
  availableForSale: z.boolean(),
  tags: z.array(z.string()),
  priceRange: z.looseObject({
    minVariantPrice: moneySchema,
    maxVariantPrice: moneySchema
  }),
  images: z.looseObject({
    edges: z.array(z.looseObject({
      node: z.looseObject({
        id: z.string(),
        image: imageSchema
      })
    }))
  }),
  options: z.array(z.looseObject({
    name: z.string(),
    optionValues: z.array(z.looseObject({ name: z.string() }))
  })),
  variants: z.looseObject({
    edges: z.array(z.looseObject({
      node: z.looseObject({
        id: z.string().min(1),
        title: z.string(),
        availableForSale: z.boolean(),
        taxable: z.boolean(),
        price: moneySchema
      })
    }))
  })
})

type ProductFetcher = (normalizedHandle: string) => Promise<ShopifyProduct | null>

export function normalizeShopifyProductHandle(handle: string): string {
  return handle.trim().toLowerCase()
}

export function normalizeShopifyProductId(productId: string | number): string {
  const normalized = String(productId).trim()
  return normalized.split('/').filter(Boolean).at(-1) ?? normalized
}

export function getShopifyCatalogRuntimeCache(): RuntimeCache {
  return getCache({ namespace: SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE })
}

export function getShopifyProductRuntimeCacheKey(handle: string): string {
  return `product:handle:${normalizeShopifyProductHandle(handle)}`
}

function getSerializedByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

function logCacheWarning(
  event: string,
  error: unknown,
  context: Record<string, unknown>
) {
  console.warn(JSON.stringify({
    event,
    level: 'WARN',
    error: error instanceof Error ? error.message : String(error),
    context: {
      ...context,
      runtime: getVercelRuntimeContext()
    }
  }))
}

export async function getRuntimeCachedShopifyProduct(
  handle: string,
  fetchProduct: ProductFetcher,
  runtimeCache: RuntimeCache = getShopifyCatalogRuntimeCache()
): Promise<ShopifyProduct | null> {
  const normalizedHandle = normalizeShopifyProductHandle(handle)
  if (!normalizedHandle) {
    throw new Error('A Shopify product handle is required')
  }

  const cacheKey = getShopifyProductRuntimeCacheKey(normalizedHandle)
  let cachedValue: unknown | null = null
  let cachedProduct: ShopifyProduct | null = null

  await startAnalyticsSpan(
    {
      name: 'cache.get shopify_product',
      op: 'cache.get',
      attributes: RUNTIME_CACHE_SPAN_ATTRIBUTES
    },
    async span => {
      try {
        cachedValue = await runtimeCache.get(cacheKey)
      } catch (error) {
        span.setAttribute('cache.hit', false)
        logCacheWarning('shopify.runtime_cache.read_failed', error, {
          cacheKey
        })
        return
      }

      if (cachedValue === null) {
        span.setAttribute('cache.hit', false)
        return
      }

      const parsedCachedValue =
        shopifyRuntimeCachedProductSchema.safeParse(cachedValue)
      if (parsedCachedValue.success) {
        span.setAttribute('cache.hit', true)
        cachedProduct = parsedCachedValue.data as unknown as ShopifyProduct
        return
      }

      span.setAttribute('cache.hit', false)
    }
  )

  if (cachedProduct) return cachedProduct

  if (cachedValue !== null) {
    try {
      await startAnalyticsSpan(
        {
          name: 'cache.remove shopify_product',
          op: 'cache.remove',
          attributes: RUNTIME_CACHE_SPAN_ATTRIBUTES
        },
        () => runtimeCache.delete(cacheKey)
      )
    } catch (error) {
      logCacheWarning(
        'shopify.runtime_cache.invalid_delete_failed',
        error,
        { cacheKey }
      )
    }
  }

  const fetchedProduct = await fetchProduct(normalizedHandle)
  if (fetchedProduct === null) return null

  const parsedFetchedProduct =
    shopifyRuntimeCachedProductSchema.safeParse(fetchedProduct)
  if (!parsedFetchedProduct.success) {
    throw new Error(
      `Shopify product ${normalizedHandle} failed runtime cache validation: ${parsedFetchedProduct.error.message}`
    )
  }

  const product = parsedFetchedProduct.data as unknown as ShopifyProduct
  const serializedBytes = getSerializedByteLength(product)
  if (serializedBytes >= SHOPIFY_PRODUCT_RUNTIME_CACHE_MAX_SAFE_BYTES) {
    logCacheWarning(
      'shopify.runtime_cache.item_too_large',
      `Serialized product is ${serializedBytes} bytes`,
      { cacheKey, serializedBytes }
    )
    return product
  }

  const normalizedProductId = normalizeShopifyProductId(product.id)

  try {
    await startAnalyticsSpan(
      {
        name: 'cache.put shopify_product',
        op: 'cache.put',
        attributes: {
          ...RUNTIME_CACHE_SPAN_ATTRIBUTES,
          'cache.item_size': serializedBytes
        }
      },
      () =>
        runtimeCache.set(cacheKey, product, {
          ttl: SHOPIFY_PRODUCT_RUNTIME_CACHE_TTL_SECONDS,
          tags: [
            `product:${normalizedProductId}`,
            `product-handle:${normalizedHandle}`,
            'catalog'
          ]
        })
    )
  } catch (error) {
    logCacheWarning('shopify.runtime_cache.write_failed', error, { cacheKey })
  }

  return product
}
