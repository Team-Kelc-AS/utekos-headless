// Path: src/api/lib/products/getCachedRelatedProducts.ts

import 'server-only'

import { getCachedProductCards } from '@/api/lib/products/getCachedProductCards'
import { getRelatedProducts } from '@/hooks/getRelatedProducts'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export async function getCachedRelatedProducts(
  currentHandle: string,
  limit: number = 12
): Promise<ProductCardModel[]> {
  const first = Math.max(limit * 2, 24)
  const allProducts = await getCachedProductCards(first)

  return getRelatedProducts(allProducts, currentHandle, limit)
}
