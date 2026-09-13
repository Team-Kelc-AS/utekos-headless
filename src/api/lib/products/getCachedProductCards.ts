import 'server-only'

import { TAGS } from '@/api/constants'
import { fetchProductCardsWithRetry } from '@/api/lib/products/fetchProductCardsWithRetry'
import { cacheLife, cacheTag } from 'next/cache'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export async function getCachedProductCards(input: {
  productHandle: string
}): Promise<ProductCardModel[]> {
  'use cache: remote'

  cacheTag(TAGS.products)
  cacheLife('collections')

  return fetchProductCardsWithRetry({
    productHandle: input.productHandle
  })
}
