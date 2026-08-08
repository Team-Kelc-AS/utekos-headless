// Path: src/api/lib/products/getProduct.ts

import 'server-only'
import {
  getProductShellQuery,
  getProductVariantPresentationQuery
} from '@/api/graphql/queries/products'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import { reshapeProduct } from '@/lib/utils/reshapeProduct'
import { cacheTag, cacheLife } from 'next/cache'
import { TAGS } from '@/api/constants'
import {
  getRuntimeCachedShopifyProduct,
  normalizeShopifyProductHandle
} from '@/lib/cache/shopifyProductRuntimeCache'
import type { ShopifyProduct } from 'types/product'
import type {
  ShopifyProductShellOperation,
  ShopifyProductVariantPresentationOperation
} from '@types'
import { composeStorefrontProduct } from './composeStorefrontProduct'

async function fetchProductFromShopify(
  handle: string
): Promise<ShopifyProduct | null> {
  const [shellResponse, variantPresentationResponse] =
    await Promise.all([
      storefrontGateway.catalogQuery<ShopifyProductShellOperation>({
        query: getProductShellQuery,
        variables: { handle }
      }),
      storefrontGateway.catalogQuery<ShopifyProductVariantPresentationOperation>({
        query: getProductVariantPresentationQuery,
        variables: { handle }
      })
    ])

  if (!shellResponse.success) {
    throw new Error(
      shellResponse.error.errors[0]?.message ??
        `Failed to fetch product shell: ${handle}`
    )
  }

  if (!variantPresentationResponse.success) {
    throw new Error(
      variantPresentationResponse.error.errors[0]?.message ??
        `Failed to fetch product variant presentation: ${handle}`
    )
  }

  const rawProduct = composeStorefrontProduct(
    shellResponse.body.product,
    variantPresentationResponse.body.product
  )
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
