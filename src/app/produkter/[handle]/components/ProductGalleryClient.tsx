'use client'

import dynamic from 'next/dynamic'
import type { ProductGalleryProps } from '@types'

const ProductGallery = dynamic(
  () =>
    import('@/components/jsx/ProductGallery').then(
      mod => mod.ProductGallery
    ),
  {
    loading: () => (
      <div className='relative aspect-9/16 w-full overflow-hidden rounded-none' />
    ),
    ssr: false
  }
)

export function ProductGalleryClient(props: ProductGalleryProps) {
  return <ProductGallery {...props} />
}
