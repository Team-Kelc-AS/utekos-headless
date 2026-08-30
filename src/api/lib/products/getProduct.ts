// Path: src/api/lib/products/getProduct.ts

import 'server-only'
import { getProductQuery } from '@/api/graphql/queries/products'
import { ShopifyCatalogGraphQLError } from '@/api/lib/products/ShopifyCatalogGraphQLError'
import { getShopifyGraphQLErrorMetadata } from '@/api/shopify/request/shopifyRequestObservability'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import { reshapeProduct } from '@/lib/utils/reshapeProduct'
import { cacheTag, cacheLife } from 'next/cache'
import { TAGS } from '@/api/constants/cacheTags'
import {
  getRuntimeCachedShopifyProduct,
  normalizeShopifyProductHandle
} from '@/lib/cache/shopifyProductRuntimeCache'
import type { ShopifyProduct } from 'types/product'
import type { ShopifyProductOperation } from '@types'

async function fetchProductFromShopify(
  handle: string
): Promise<ShopifyProduct | null> {
  const response =
    await storefrontGateway.catalogQuery<ShopifyProductOperation>(
      { query: getProductQuery, variables: { handle } }
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

export async function getProduct(
  handle: string
): Promise<ShopifyProduct | null> {
  'use cache: remote'

  const normalizedHandle = normalizeShopifyProductHandle(handle)
  cacheTag(`product-${normalizedHandle}`, TAGS.products)
  cacheLife('products')

  return getRuntimeCachedShopifyProduct(
    normalizedHandle,
    fetchProductFromShopify
  )
}
