// Path: src/api/lib/products/getProducts.ts

import 'server-only'
import { getProductsQuery } from '@/api/graphql/queries/products'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import { reshapeProducts } from '@/lib/utils/reshapeProducts'
import { flattenConnection } from '@shopify/hydrogen-react/flatten-connection'
import type {
  GetProductsParams,
  GetProductsResponse,
  ShopifyProductsOperation
} from '@types'
import type { ShopifyProduct } from 'types/product'
import { cacheLife, cacheTag } from 'next/cache'
import { TAGS } from '@/api/constants/cacheTags'

export async function fetchProducts(
  params: GetProductsParams = {}
): Promise<ShopifyProduct[]> {
  const variables = { first: 12, ...params }

  const res =
    await storefrontGateway.catalogQuery<ShopifyProductsOperation>(
      { query: getProductsQuery, variables }
    )

  if (!res.success) {
    throw new Error(
      res.error.errors[0]?.message ?? 'Failed to fetch products'
    )
  }

  if (!res.body.products) {
    throw new Error('Invalid response structure')
  }

  return reshapeProducts(flattenConnection(res.body.products))
}

export async function getProducts(
  params: GetProductsParams = {}
): Promise<GetProductsResponse> {
  'use cache'

  cacheTag(TAGS.products)

  try {
    const products = await fetchProducts(params)

    cacheLife('collections')
    return { success: true, status: 200, body: products }
  } catch (error) {
    // Transient failures must expire before the overview retries.
    cacheLife({ stale: 0, revalidate: 0, expire: 1 })
    return {
      success: false,
      status: 500,
      error:
        error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
