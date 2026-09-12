// Path: src/api/lib/products/getProduct.ts

import 'server-only'
import { getProductQuery } from '@/api/graphql/queries/products'
import { ShopifyCatalogGraphQLError } from '@/api/lib/products/ShopifyCatalogGraphQLError'
import { getShopifyGraphQLErrorMetadata } from '@/api/shopify/request/shopifyRequestObservability'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import { reshapeProduct } from '@/lib/utils/reshapeProduct'
import { cacheTag, cacheLife } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { TAGS } from '@/api/constants/cacheTags'
import {
  fetchShopifyProductWithFallback,
  normalizeShopifyProductHandle,
  SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE
} from '@/lib/cache/shopifyProductRuntimeCache'
import type { ShopifyProduct } from 'types/product'
import type { ShopifyProductOperation } from '@types'

async function fetchProductFromShopify(
  handle: string
): Promise<ShopifyProduct | null> {
  const response =
    await storefrontGateway.catalogQuery<ShopifyProductOperation>(
      {
        query: getProductQuery,
        variables: { handle },
        cache: 'no-store'
      }
    )

  if (!response.success) {
    const graphqlError = getShopifyGraphQLErrorMetadata(
      response.error
    )
    throw new ShopifyCatalogGraphQLError(
      response.error.errors[0]?.message ??
        `Failed to fetch product: ${handle}`,
      graphqlError.code ?? null
    )
  }

  const rawProduct = response.body.product
  if (!rawProduct) return null

  return reshapeProduct(rawProduct)
}

async function getCachedShopifyProduct(
  normalizedHandle: string
) {
  'use cache: remote'

  cacheTag(`product-${normalizedHandle}`, TAGS.products)
  cacheLife('products')

  try {
    const result = await fetchShopifyProductWithFallback(
      normalizedHandle,
      fetchProductFromShopify
    )
    if (result.isFallback) {
      cacheLife(SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE)
    }
    return { success: true as const, product: result.data }
  } catch (error) {
    unstable_rethrow(error)
    cacheLife(SHOPIFY_PRODUCT_RECOVERY_CACHE_LIFE)
    return {
      success: false as const,
      error:
        error instanceof Error ?
          error.message
        : 'Product fetch failed'
    }
  }
}

export async function getProduct(
  handle: string
): Promise<ShopifyProduct | null> {
  const result = await getCachedShopifyProduct(
    normalizeShopifyProductHandle(handle)
  )
  if (!result.success) throw new Error(result.error)
  return result.product
}
