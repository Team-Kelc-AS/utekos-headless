import 'server-only'

import { getCache, type RuntimeCache } from '@vercel/functions'
import { z } from 'zod'
import { isRetryableShopifyCatalogError } from '@/api/lib/products/isRetryableShopifyCatalogError'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type { ShopifyProduct } from 'types/product'

export const SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE =
  'shopify-catalog:v2'
export const SHOPIFY_PRODUCT_RUNTIME_CACHE_TTL_SECONDS = 3_600
export const SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS = 86_400
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
  id: z.string(),
  url: z.string().min(1),
  altText: z.string(),
  width: z.number(),
  height: z.number()
})

const selectedOptionSchema = z.looseObject({
  name: z.string(),
  value: z.string()
})

const productVariantSchema = z.looseObject({
  id: z.string().min(1),
  title: z.string(),
  barcode: z.string().nullable(),
  availableForSale: z.boolean(),
  currentlyNotInStock: z.boolean(),
  taxable: z.boolean(),
  selectedOptions: z.array(selectedOptionSchema),
  price: moneySchema,
  image: imageSchema.nullable(),
  compareAtPrice: moneySchema.nullable(),
  metafield: z
    .looseObject({
      namespace: z.string(),
      key: z.string(),
      reference: z.unknown().nullable()
    })
    .nullable(),
  sku: z.string().optional(),
  variantProfile: z.null(),
  variantProfileData: z.looseObject({}).optional(),
  weight: z.number().nullable(),
  weightUnit: z.string(),
  quantityAvailable: z.number().nullable()
})

export const shopifyRuntimeCachedProductSchema = z.looseObject({
  id: z.string().min(1),
  title: z.string().min(1),
  handle: z.string().min(1),
  productType: z.string(),
  totalInventory: z.number(),
  vendor: z.string(),
  updatedAt: z.string().min(1),
  collections: z.looseObject({
    nodes: z.array(
      z.looseObject({
        id: z.string().min(1),
        title: z.string(),
        handle: z.string()
      })
    )
  }),
  compareAtPriceRange: z.looseObject({
    minVariantPrice: moneySchema,
    maxVariantPrice: moneySchema
  }),
  availableForSale: z.boolean(),
  tags: z.array(z.string()),
  priceRange: z.looseObject({
    minVariantPrice: moneySchema,
    maxVariantPrice: moneySchema
  }),
  images: z.looseObject({
    edges: z.array(
      z.looseObject({
        node: z.looseObject({
          id: z.string(),
          image: imageSchema
        })
      })
    )
  }),
  options: z.array(
    z.looseObject({
      name: z.string(),
      optionValues: z.array(z.looseObject({ name: z.string() }))
    })
  ),
  description: z.string().nullable().optional(),
  featuredImage: imageSchema.nullable(),
  relatedProducts: z.array(z.unknown()).max(0),
  category: z.unknown().nullable(),
  variantProfile: z.unknown().nullable(),
  seo: z.looseObject({
    title: z.string().nullable(),
    description: z.string().nullable()
  }),
  selectedOrFirstAvailableVariant:
    productVariantSchema.optional(),
  variants: z.looseObject({
    edges: z.array(z.looseObject({ node: productVariantSchema }))
  }),
  weight: z
    .looseObject({ unit: z.string(), value: z.number() })
    .optional()
})

const shopifyProductLastGoodSnapshotSchema = z.looseObject({
  cachedAt: z.iso.datetime(),
  product: shopifyRuntimeCachedProductSchema
})

type ShopifyProductLastGoodSnapshot = {
  cachedAt: string
  product: ShopifyProduct
}

type ProductFetcher = (
  normalizedHandle: string
) => Promise<ShopifyProduct | null>

type ProductBatchFetcher = (
  normalizedHandles: readonly string[]
) => Promise<ShopifyProduct[]>

export function normalizeShopifyProductHandle(
  handle: string
): string {
  return handle.trim().toLowerCase()
}

export function normalizeShopifyProductId(
  productId: string | number
): string {
  const normalized = String(productId).trim()
  return (
    normalized.split('/').filter(Boolean).at(-1) ?? normalized
  )
}

export function getShopifyCatalogRuntimeCache(): RuntimeCache {
  return getCache({
    namespace: SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE
  })
}

export function getShopifyProductRuntimeCacheKey(
  handle: string
): string {
  return `product:handle:${normalizeShopifyProductHandle(handle)}`
}

export function getShopifyProductLastGoodRuntimeCacheKey(
  handle: string
): string {
  return `product:last-good:handle:${normalizeShopifyProductHandle(handle)}`
}

export function getShopifyProductLastGoodRuntimeCacheTags(
  handle: string,
  productId: string | number
): string[] {
  return [
    'product-last-good',
    `product-last-good:${normalizeShopifyProductId(productId)}`,
    `product-last-good-handle:${normalizeShopifyProductHandle(handle)}`
  ]
}

function getSerializedByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value))
    .byteLength
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
      error:
        error instanceof Error ? error.message : String(error),
      context: { ...context, runtime: getVercelRuntimeContext() }
    })
  )
}

function normalizeUniqueShopifyProductHandles(
  handles: readonly string[]
): string[] {
  return Array.from(
    new Set(
      handles
        .map(normalizeShopifyProductHandle)
        .filter(Boolean)
    )
  )
}

function orderProductsByHandles(
  handles: readonly string[],
  products: readonly ShopifyProduct[]
): ShopifyProduct[] {
  const productsByHandle = new Map(
    products.map(product => [
      normalizeShopifyProductHandle(product.handle),
      product
    ])
  )

  return handles.flatMap(handle => {
    const product = productsByHandle.get(handle)
    return product ? [product] : []
  })
}

async function deleteRuntimeCacheKey(
  runtimeCache: RuntimeCache,
  cacheKey: string,
  event: string
): Promise<void> {
  try {
    await runtimeCache.delete(cacheKey)
  } catch (error) {
    logCacheWarning(event, error, { cacheKey })
  }
}

async function getLastGoodSnapshot(
  runtimeCache: RuntimeCache,
  cacheKey: string
): Promise<ShopifyProductLastGoodSnapshot | null> {
  let cachedValue: unknown | null

  try {
    cachedValue = await runtimeCache.get(cacheKey)
  } catch (error) {
    logCacheWarning(
      'shopify.runtime_cache.last_good_read_failed',
      error,
      { cacheKey }
    )
    return null
  }

  if (cachedValue === null) return null

  const parsed =
    shopifyProductLastGoodSnapshotSchema.safeParse(cachedValue)
  if (parsed.success) {
    return parsed.data as unknown as ShopifyProductLastGoodSnapshot
  }

  await deleteRuntimeCacheKey(
    runtimeCache,
    cacheKey,
    'shopify.runtime_cache.invalid_last_good_delete_failed'
  )
  return null
}

async function setLastGoodSnapshot(
  runtimeCache: RuntimeCache,
  normalizedHandle: string,
  product: ShopifyProduct,
  serializedProductBytes: number
): Promise<void> {
  const cacheKey =
    getShopifyProductLastGoodRuntimeCacheKey(normalizedHandle)
  const snapshot: ShopifyProductLastGoodSnapshot = {
    cachedAt: new Date().toISOString(),
    product
  }

  try {
    await startAnalyticsSpan(
      {
        name: 'cache.put shopify_product_last_good',
        op: 'cache.put',
        attributes: {
          ...RUNTIME_CACHE_SPAN_ATTRIBUTES,
          'cache.item_size': serializedProductBytes
        }
      },
      () =>
        runtimeCache.set(cacheKey, snapshot, {
          ttl: SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS,
          tags: getShopifyProductLastGoodRuntimeCacheTags(
            normalizedHandle,
            product.id
          ),
          name: 'shopify-product-last-good'
        })
    )
  } catch (error) {
    logCacheWarning(
      'shopify.runtime_cache.last_good_write_failed',
      error,
      { cacheKey }
    )
  }
}

async function storeFetchedProduct(
  runtimeCache: RuntimeCache,
  normalizedHandle: string,
  fetchedProduct: ShopifyProduct | null
): Promise<ShopifyProduct | null> {
  const cacheKey =
    getShopifyProductRuntimeCacheKey(normalizedHandle)
  const lastGoodCacheKey =
    getShopifyProductLastGoodRuntimeCacheKey(normalizedHandle)

  if (fetchedProduct === null) {
    await Promise.all([
      deleteRuntimeCacheKey(
        runtimeCache,
        cacheKey,
        'shopify.runtime_cache.missing_product_delete_failed'
      ),
      deleteRuntimeCacheKey(
        runtimeCache,
        lastGoodCacheKey,
        'shopify.runtime_cache.last_good_delete_failed'
      )
    ])
    return null
  }

  const parsedFetchedProduct =
    shopifyRuntimeCachedProductSchema.safeParse(fetchedProduct)
  if (!parsedFetchedProduct.success) {
    throw new Error(
      `Shopify product ${normalizedHandle} failed runtime cache validation: ${parsedFetchedProduct.error.message}`
    )
  }

  const product =
    parsedFetchedProduct.data as unknown as ShopifyProduct
  const serializedBytes = getSerializedByteLength(product)
  if (
    serializedBytes >=
    SHOPIFY_PRODUCT_RUNTIME_CACHE_MAX_SAFE_BYTES
  ) {
    logCacheWarning(
      'shopify.runtime_cache.item_too_large',
      `Serialized product is ${serializedBytes} bytes`,
      { cacheKey, serializedBytes }
    )
    return product
  }

  const normalizedProductId = normalizeShopifyProductId(
    product.id
  )

  await Promise.all([
    setLastGoodSnapshot(
      runtimeCache,
      normalizedHandle,
      product,
      serializedBytes
    ),
    (async () => {
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
        logCacheWarning(
          'shopify.runtime_cache.write_failed',
          error,
          { cacheKey }
        )
      }
    })()
  ])

  return product
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

  const cacheKey =
    getShopifyProductRuntimeCacheKey(normalizedHandle)
  const lastGoodCacheKey =
    getShopifyProductLastGoodRuntimeCacheKey(normalizedHandle)
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
        logCacheWarning(
          'shopify.runtime_cache.read_failed',
          error,
          { cacheKey }
        )
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
        cachedProduct =
          parsedCachedValue.data as unknown as ShopifyProduct
        return
      }

      span.setAttribute('cache.hit', false)
    }
  )

  if (cachedProduct) {
    const existingLastGood = await getLastGoodSnapshot(
      runtimeCache,
      lastGoodCacheKey
    )

    if (!existingLastGood) {
      const serializedBytes =
        getSerializedByteLength(cachedProduct)
      if (
        serializedBytes <
        SHOPIFY_PRODUCT_RUNTIME_CACHE_MAX_SAFE_BYTES
      ) {
        await setLastGoodSnapshot(
          runtimeCache,
          normalizedHandle,
          cachedProduct,
          serializedBytes
        )
      }
    }

    return cachedProduct
  }

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

  const lastGoodSnapshot = await getLastGoodSnapshot(
    runtimeCache,
    lastGoodCacheKey
  )

  let fetchedProduct: ShopifyProduct | null

  try {
    fetchedProduct = await fetchProduct(normalizedHandle)
  } catch (error) {
    if (
      lastGoodSnapshot &&
      isRetryableShopifyCatalogError(error)
    ) {
      logCacheWarning(
        'shopify.runtime_cache.served_last_good',
        error,
        {
          cacheKey: lastGoodCacheKey,
          cachedAt: lastGoodSnapshot.cachedAt,
          ageMs: Math.max(
            0,
            Date.now() -
              new Date(lastGoodSnapshot.cachedAt).getTime()
          )
        }
      )
      return lastGoodSnapshot.product
    }

    throw error
  }

  return storeFetchedProduct(
    runtimeCache,
    normalizedHandle,
    fetchedProduct
  )
}

export async function getRuntimeCachedShopifyProductsByHandles(
  handles: readonly string[],
  fetchProducts: ProductBatchFetcher,
  runtimeCache: RuntimeCache = getShopifyCatalogRuntimeCache()
): Promise<ShopifyProduct[]> {
  const normalizedHandles =
    normalizeUniqueShopifyProductHandles(handles)

  if (normalizedHandles.length === 0) {
    return []
  }

  const lastGoodSnapshots = await Promise.all(
    normalizedHandles.map(handle =>
      getLastGoodSnapshot(
        runtimeCache,
        getShopifyProductLastGoodRuntimeCacheKey(handle)
      )
    )
  )

  let fetchedProducts: ShopifyProduct[]

  try {
    fetchedProducts = await fetchProducts(normalizedHandles)
  } catch (error) {
    if (isRetryableShopifyCatalogError(error)) {
      const lastGoodProducts = lastGoodSnapshots.flatMap(
        snapshot => snapshot ? [snapshot.product] : []
      )

      if (lastGoodProducts.length > 0) {
        logCacheWarning(
          'shopify.runtime_cache.batch_served_last_good',
          error,
          {
            requestedCount: normalizedHandles.length,
            servedCount: lastGoodProducts.length
          }
        )

        return orderProductsByHandles(
          normalizedHandles,
          lastGoodProducts
        )
      }
    }

    throw error
  }

  const parsedFetchedProducts = z
    .array(shopifyRuntimeCachedProductSchema)
    .safeParse(fetchedProducts)

  if (!parsedFetchedProducts.success) {
    throw new Error(
      `Shopify product batch failed runtime cache validation: ${parsedFetchedProducts.error.message}`
    )
  }

  const orderedProducts = orderProductsByHandles(
    normalizedHandles,
    parsedFetchedProducts.data as unknown as ShopifyProduct[]
  )
  const productsByHandle = new Map(
    orderedProducts.map(product => [
      normalizeShopifyProductHandle(product.handle),
      product
    ])
  )

  await Promise.all(
    normalizedHandles.map(handle =>
      storeFetchedProduct(
        runtimeCache,
        handle,
        productsByHandle.get(handle) ?? null
      )
    )
  )

  return orderedProducts
}
