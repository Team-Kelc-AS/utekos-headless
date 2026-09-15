// Path: src/app/(store)/produkter/%5Bhandle%5D/utils/getProductDisplayImage.ts

import type { ShopifyProduct } from 'types/product'
import { computeVariantImages } from '@/lib/utils/computeVariantImages'

export function getProductDisplayImage(product: ShopifyProduct) {
  const defaultImages = computeVariantImages(product, null)

  return defaultImages[0] || product.featuredImage || null
}
