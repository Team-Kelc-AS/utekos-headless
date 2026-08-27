import 'server-only'

import { cacheSignal } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { TAGS } from '@/api/constants'
import { fetchProductCardsWithRetry } from './fetchProductCardsWithRetry'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export async function getCachedProductCards(
  first: number
): Promise<ProductCardModel[]> {
  'use cache: remote'

  cacheTag(TAGS.products)
  cacheLife('collections')

  const signal = cacheSignal()

  return fetchProductCardsWithRetry({
    first,
    ...(signal ? { signal } : {})
  })
}
