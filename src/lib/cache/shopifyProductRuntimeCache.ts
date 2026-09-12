import 'server-only'

import { getCache, type RuntimeCache } from '@vercel/functions'
import { z } from 'zod'
import { isRetryableShopifyCatalogError } from '@/api/lib/products/isRetryableShopifyCatalogError'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type { ShopifyProduct } from 'types/product'

export const SHOPIFY_CATALOG_RUNTIME_CACHE_NAMESPACE =
  'shopify-catalog:v2'
export const SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS = 86_400
export const SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE = {
  // Keep the page shell prerenderable while retrying transient failures promptly.
  // https://nextjs.org/docs/app/api-reference/functions/cacheLife#prerendering-behavior
  stale: 300,
  revalidate: 30,
  expire: 300
} as const
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
      handles.map(normalizeShopifyProductHandle).filter(Boolean)
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
  normalizedHandle: string
): Promise<ShopifyProductLastGoodSnapshot | null> {
  const cacheKey =
    getShopifyProductLastGoodRuntimeCacheKey(normalizedHandle)
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
    const ageMs = Date.now() - Date.parse(parsed.data.cachedAt)
    const maxAgeMs =
      (SHOPIFY_PRODUCT_LAST_GOOD_RUNTIME_CACHE_TTL_SECONDS -
        SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE.expire) *
      1000
    if (
      ageMs >= 0 &&
      ageMs < maxAgeMs &&
      normalizeShopifyProductHandle(
        parsed.data.product.handle
      ) === normalizedHandle
    ) {
      return parsed.data as unknown as ShopifyProductLastGoodSnapshot
    }
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
    getShopifyProductLastGoodRuntimeCacheKey(normalizedHandle)

  if (fetchedProduct === null) {
    await deleteRuntimeCacheKey(
      runtimeCache,
      cacheKey,
      'shopify.runtime_cache.last_good_delete_failed'
    )
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
  if (
    normalizeShopifyProductHandle(product.handle) !==
    normalizedHandle
  ) {
    throw new Error(
      `Shopify returned a different product for ${normalizedHandle}`
    )
  }
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

  await setLastGoodSnapshot(
    runtimeCache,
    normalizedHandle,
    product,
    serializedBytes
  )

  return product
}

export async function fetchShopifyProductWithFallback(
  handle: string,
  fetchProduct: ProductFetcher,
  runtimeCache: RuntimeCache = getShopifyCatalogRuntimeCache()
): Promise<{
  data: ShopifyProduct | null
  isFallback: boolean
}> {
  const normalizedHandle = normalizeShopifyProductHandle(handle)
  if (!normalizedHandle) {
    throw new Error('A Shopify product handle is required')
  }

  let fetchedProduct: ShopifyProduct | null

  try {
    fetchedProduct = await fetchProduct(normalizedHandle)
  } catch (error) {
    if (isRetryableShopifyCatalogError(error)) {
      const lastGoodSnapshot = await getLastGoodSnapshot(
        runtimeCache,
        normalizedHandle
      )
      if (lastGoodSnapshot) {
        logCacheWarning(
          'shopify.runtime_cache.served_last_good',
          error,
          {
            cacheKey:
              getShopifyProductLastGoodRuntimeCacheKey(
                normalizedHandle
              ),
            cachedAt: lastGoodSnapshot.cachedAt,
            ageMs:
              Date.now() - Date.parse(lastGoodSnapshot.cachedAt)
          }
        )
        return {
          data: lastGoodSnapshot.product,
          isFallback: true
        }
      }
    }
    throw error
  }

  return {
    data: await storeFetchedProduct(
      runtimeCache,
      normalizedHandle,
      fetchedProduct
    ),
    isFallback: false
  }
}

export async function fetchShopifyProductsWithFallback(
  handles: readonly string[],
  fetchProducts: ProductBatchFetcher,
  runtimeCache: RuntimeCache = getShopifyCatalogRuntimeCache()
): Promise<{ data: ShopifyProduct[]; isFallback: boolean }> {
  const normalizedHandles =
    normalizeUniqueShopifyProductHandles(handles)

  if (normalizedHandles.length === 0) {
    return { data: [], isFallback: false }
  }

  let fetchedProducts: ShopifyProduct[]

  try {
    fetchedProducts = await fetchProducts(normalizedHandles)
  } catch (error) {
    if (isRetryableShopifyCatalogError(error)) {
      const lastGoodSnapshots = await Promise.all(
        normalizedHandles.map(handle =>
          getLastGoodSnapshot(runtimeCache, handle)
        )
      )
      const lastGoodProducts = lastGoodSnapshots.flatMap(
        snapshot => (snapshot ? [snapshot.product] : [])
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

        return {
          data: orderProductsByHandles(
            normalizedHandles,
            lastGoodProducts
          ),
          isFallback: true
        }
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

  return { data: orderedProducts, isFallback: false }
}
