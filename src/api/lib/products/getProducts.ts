// Path: src/api/lib/products/getProducts.ts

import 'server-only'
import { getProductsQuery } from '@/api/graphql/queries/products'
import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import { reshapeProducts } from '@/lib/utils/reshapeProducts'
import { flattenConnection } from '@shopify/hydrogen-react'
import type {
  GetProductsParams,
  GetProductsResponse,
  ShopifyProductsOperation
} from '@types'
import type { ShopifyProduct } from 'types/product'
import { cacheLife, cacheTag } from 'next/cache'
import { TAGS } from '../../constants'

export async function fetchProducts(
  params: GetProductsParams = {}
): Promise<ShopifyProduct[]> {
  const variables = { first: 12, ...params }

  const res = await shopifyFetch<ShopifyProductsOperation>({
    query: getProductsQuery,
    variables
  })

  if (!res.success) {
    throw new Error(res.error.errors[0]?.message ?? 'Failed to fetch products')
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
  cacheLife('collections')

  try {
    const products = await fetchProducts(params)

    return {
      success: true,
      status: 200,
      body: products
    }
  } catch (error) {
    return {
      success: false,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
