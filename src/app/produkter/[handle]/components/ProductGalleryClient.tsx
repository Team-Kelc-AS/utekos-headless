'use client'

import { ProductGallery } from '@/components/jsx/ProductGallery'
import type { ProductGalleryProps } from '@types'

export function ProductGalleryClient(
  props: ProductGalleryProps
) {
  return <ProductGallery {...props} />
}