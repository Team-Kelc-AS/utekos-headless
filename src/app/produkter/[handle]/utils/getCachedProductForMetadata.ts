// src/app/produkter/[handle]/utils/getCachedProductForMetadata.ts

import { getProduct } from '@/api/lib/products/getProduct'
import { reshapeProductWithMetafields } from '@/hooks/useProductWithMetafields'

export async function getCachedProductForMetadata(
  handle: string
) {
  const rawProduct = await getProduct(handle)

  if (!rawProduct) {
    return null
  }

  return reshapeProductWithMetafields(rawProduct) || rawProduct
}
