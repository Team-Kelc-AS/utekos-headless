'use cache'
import 'server-only'

import { handles } from '@/db/data/products/product-info'
import { getFeaturedProductsQuery } from '@/api/graphql/queries/products'
import { ShopifyCatalogGraphQLError } from '@/api/lib/products/ShopifyCatalogGraphQLError'
import { getShopifyGraphQLErrorMetadata } from '@/api/shopify/request/shopifyRequestObservability'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import {
  getRuntimeCachedShopifyProductsByHandles,
  normalizeShopifyProductHandle
} from '@/lib/cache/shopifyProductRuntimeCache'
import { reshapeProduct } from '@/lib/utils/reshapeProduct'
import { cacheLife, cacheTag } from 'next/cache'
import { cacheSignal } from 'react'
import type { ShopifyFeaturedProductsOperation } from '@types'
import type { ShopifyProduct } from 'types/product'

async function fetchFeaturedProductsFromShopify(
  productHandles: readonly string[],
  signal: AbortSignal | null
): Promise<ShopifyProduct[]> {
  const [handle0, handle1, handle2, extraHandle] = productHandles
  if (!handle0 || !handle1 || !handle2 || extraHandle) {
    throw new Error(
      'Featured products query requires exactly three handles'
    )
  }

  const response =
    await storefrontGateway.catalogQuery<ShopifyFeaturedProductsOperation>(
      {
        query: getFeaturedProductsQuery,
        variables: { handle0, handle1, handle2 },
        ...(signal ? { signal } : {})
      }
    )

  if (!response.success) {
    const graphqlError = getShopifyGraphQLErrorMetadata(
      response.error
    )
    throw new ShopifyCatalogGraphQLError(
      response.error.errors[0]?.message ??
        'Failed to fetch featured products',
      graphqlError.code ?? null
    )
  }

  return [
    response.body.product0,
    response.body.product1,
    response.body.product2
  ]
    .filter(product => product !== null)
    .map(reshapeProduct)
}

export async function getFeaturedProducts() {
  cacheLife('hours')
  cacheTag('products')

  const normalizedHandles = handles
    .map(normalizeShopifyProductHandle)
    .filter(Boolean)
  const signal = cacheSignal()

  return getRuntimeCachedShopifyProductsByHandles(
    normalizedHandles,
    requestedHandles =>
      fetchFeaturedProductsFromShopify(requestedHandles, signal)
  )
}
