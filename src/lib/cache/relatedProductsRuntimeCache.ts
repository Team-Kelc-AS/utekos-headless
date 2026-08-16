import 'server-only'

import { z } from 'zod'
import type { RuntimeCache } from '@vercel/functions'
import {
  RELATED_PRODUCTS_RUNTIME_CACHE_NAME,
  RELATED_PRODUCTS_RUNTIME_CACHE_TAG,
  RELATED_PRODUCTS_RUNTIME_CACHE_TTL_SECONDS
} from '@/api/lib/products/relatedProductsPolicy'
import {
  getShopifyCatalogRuntimeCache,
  normalizeShopifyProductHandle,
  SHOPIFY_PRODUCT_RUNTIME_CACHE_MAX_SAFE_BYTES
} from '@/lib/cache/shopifyProductRuntimeCache'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

const moneySchema = z.looseObject({
  amount: z.string().min(1),
  currencyCode: z.string().min(1)
})

const imageSchema = z.looseObject({
  id: z.string(),
  url: z.union([z.string().url(), z.string().min(1)]),
  altText: z.string(),
  width: z.number(),
  height: z.number()
})

const relatedProductCardSchema = z.looseObject({
  id: z.string().min(1),
  title: z.string().min(1),
  handle: z.string().min(1),
  productType: z.string(),
  vendor: z.string(),
  featuredImage: imageSchema.nullable(),
  collections: z.looseObject({
    nodes: z.array(
      z.looseObject({
        id: z.string().min(1),
        title: z.string().min(1)
      })
    )
  }),
  priceRange: z.looseObject({
    minVariantPrice: moneySchema
  }),
  options: z.array(
    z.looseObject({
      name: z.string().min(1),
      optionValues: z.array(z.looseObject({ name: z.string().min(1) }))
    })
  ),
  variants: z.looseObject({
    edges: z.array(
      z.looseObject({
        node: z.looseObject({
          id: z.string().min(1),
          title: z.string(),
          barcode: z.string().nullable(),
          availableForSale: z.boolean(),
          currentlyNotInStock: z.boolean(),
          taxable: z.boolean(),
          selectedOptions: z.array(
            z.looseObject({
              name: z.string(),
              value: z.string()
            })
          ),
          price: moneySchema,
          image: imageSchema.nullable(),
          compareAtPrice: moneySchema.nullable(),
          sku: z.string().optional(),
          quantityAvailable: z.number().nullable()
        })
      })
    )
  })
})

const relatedProductsSnapshotSchema = z.array(relatedProductCardSchema)

function getSerializedByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

function logCacheWarning(
  event: string,
  error: unknown,
  context: Record<string, unknown>
) {
  console.warn(
    JSON.stringify({
      event,
      level: 'WARN',
      error: error instanceof Error ? error.message : String(error),
      context: {
        ...context,
        runtime: getVercelRuntimeContext()
      }
    })
  )
}

export function getRelatedProductsRuntimeCacheKey(handle: string): string {
  return `related-products:handle:${normalizeShopifyProductHandle(handle)}`
}

export function getRelatedProductsRuntimeCacheTags(handle: string): string[] {
  const normalizedHandle = normalizeShopifyProductHandle(handle)

  return [
    'catalog',
    RELATED_PRODUCTS_RUNTIME_CACHE_TAG,
    `related-products-handle:${normalizedHandle}`
  ]
}

export async function getRelatedProductsSnapshot(
  handle: string,
  runtimeCache?: RuntimeCache
): Promise<ProductCardModel[] | null> {
  const cache = runtimeCache ?? getShopifyCatalogRuntimeCache()
  const normalizedHandle = normalizeShopifyProductHandle(handle)
  if (!normalizedHandle) {
    return null
  }

  const cacheKey = getRelatedProductsRuntimeCacheKey(normalizedHandle)

  try {
    const cachedValue = await cache.get(cacheKey)
    if (cachedValue == null) {
      return null
    }

    const parsed = relatedProductsSnapshotSchema.safeParse(cachedValue)
    if (parsed.success) {
      return parsed.data as ProductCardModel[]
    }

    await cache.delete(cacheKey)
  } catch (error) {
    logCacheWarning('shopify.related_products.runtime_cache.read_failed', error, {
      cacheKey
    })
  }

  return null
}

export async function setRelatedProductsSnapshot(
  handle: string,
  products: ProductCardModel[],
  runtimeCache?: RuntimeCache
): Promise<void> {
  const normalizedHandle = normalizeShopifyProductHandle(handle)
  if (!normalizedHandle || products.length === 0) {
    return
  }

  const parsed = relatedProductsSnapshotSchema.safeParse(products)
  if (!parsed.success) {
    logCacheWarning(
      'shopify.related_products.runtime_cache.invalid_write',
      parsed.error,
      { handle: normalizedHandle }
    )
    return
  }

  const snapshot = parsed.data as ProductCardModel[]
  const serializedBytes = getSerializedByteLength(snapshot)
  if (serializedBytes >= SHOPIFY_PRODUCT_RUNTIME_CACHE_MAX_SAFE_BYTES) {
    logCacheWarning(
      'shopify.related_products.runtime_cache.item_too_large',
      `Serialized related products are ${serializedBytes} bytes`,
      { handle: normalizedHandle, serializedBytes }
    )
    return
  }

  const cache = runtimeCache ?? getShopifyCatalogRuntimeCache()
  const cacheKey = getRelatedProductsRuntimeCacheKey(normalizedHandle)

  try {
    await cache.set(cacheKey, snapshot, {
      ttl: RELATED_PRODUCTS_RUNTIME_CACHE_TTL_SECONDS,
      tags: getRelatedProductsRuntimeCacheTags(normalizedHandle),
      name: RELATED_PRODUCTS_RUNTIME_CACHE_NAME
    })
  } catch (error) {
    logCacheWarning('shopify.related_products.runtime_cache.write_failed', error, {
      cacheKey
    })
  }
}
