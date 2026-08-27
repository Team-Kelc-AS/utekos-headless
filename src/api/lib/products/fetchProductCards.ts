import 'server-only'

import { getProductCardsQuery } from '@/api/graphql/queries/products'
import { ShopifyCatalogGraphQLError } from '@/api/lib/products/ShopifyCatalogGraphQLError'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import { getShopifyGraphQLErrorMetadata } from '@/api/shopify/request/shopifyRequestObservability'
import { reshapeProductCard } from '@/lib/shopify/reshapeProductCard'
import type { ShopifyProductCardsOperation } from '@types'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export async function fetchProductCards(input: {
  first: number
  timeoutMs: number
  signal?: AbortSignal
}): Promise<ProductCardModel[]> {
  const res = await storefrontGateway.catalogQuery<ShopifyProductCardsOperation>(
    {
      cache: 'no-store',
      failureImpact: 'optional',
      query: getProductCardsQuery,
      timeoutMs: input.timeoutMs,
      variables: { first: input.first },
      ...(input.signal ? { signal: input.signal } : {})
    }
  )

  if (!res.success) {
    const graphqlError = getShopifyGraphQLErrorMetadata(res.error)
    throw new ShopifyCatalogGraphQLError(
      res.error.errors[0]?.message ?? 'Failed to fetch product cards',
      graphqlError.code ?? null
    )
  }

  if (!res.body.products) {
    throw new ShopifyCatalogGraphQLError(
      'Invalid product card response structure'
    )
  }

  return res.body.products.edges.map(edge => reshapeProductCard(edge.node))
}
