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
    return {
      status: 'unavailable',
      error:
        error instanceof Error ?
          { name: error.name, message: error.message }
        : { name: 'Error', message: String(error) }
    }
  }
}
