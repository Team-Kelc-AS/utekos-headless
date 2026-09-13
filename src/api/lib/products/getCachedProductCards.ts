import 'server-only'

import { TAGS } from '@/api/constants'
import { fetchProductCardsWithRetry } from '@/api/lib/products/fetchProductCardsWithRetry'
import { cacheLife, cacheTag } from 'next/cache'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export type CachedProductCardsResult =
  | { status: 'success'; products: ProductCardModel[] }
  | {
      status: 'unavailable'
      error: { name: string; message: string }
    }

function serializeCatalogError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }

  if (typeof error === 'string') {
    return { name: 'Error', message: error }
  }

  return {
    name: 'UnknownError',
    message: 'Storefront product-card fetch failed'
  }
}

export async function getCachedProductCards(input: {
  first: number
}): Promise<CachedProductCardsResult> {
  'use cache: remote'

  cacheTag(TAGS.products)
  cacheLife('collections')

  try {
    const products = await fetchProductCardsWithRetry({
      first: input.first
    })
    return { status: 'success', products }
  } catch (error) {
    cacheLife({ stale: 0, revalidate: 0, expire: 1 })

    return {
      status: 'unavailable',
      error: serializeCatalogError(error)
    }
  }
}
