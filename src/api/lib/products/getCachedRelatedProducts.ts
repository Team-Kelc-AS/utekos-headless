// Path: src/api/lib/products/getCachedRelatedProducts.ts

import 'server-only'

import { loadRelatedProducts } from '@/api/lib/products/loadRelatedProducts'
import { cacheLife, cacheTag } from 'next/cache'
import { TAGS } from '@/api/constants'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export async function getCachedRelatedProducts(
  currentHandle: string,
  limit: number = 12
): Promise<ProductCardModel[]> {
  'use cache: remote'

  cacheTag(`related-products-${currentHandle}`, TAGS.products)
  cacheLife('collections')

  try {
    return await loadRelatedProducts(currentHandle, limit)
  } catch {
    return []
  }
}
