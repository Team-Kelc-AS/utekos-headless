import { ProductGridSkeleton } from '@/components/frontpage/Skeletons/ProductGridSkeleton'
import { ProductCarousel } from './ProductCarousel'
import { Suspense } from 'react'

export function LazyFeaturedProductCarousel() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductCarousel />
    </Suspense>
  )
}
