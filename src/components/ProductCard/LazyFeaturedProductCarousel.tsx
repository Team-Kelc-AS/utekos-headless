import { ProductGridSkeleton } from '@/components/frontpage/Skeletons/ProductGridSkeleton'
import { ProductCarousel } from './ProductCarousel'
import { Suspense } from 'react'

type LazyFeaturedProductCarouselProps = {
  productHandleToMoveLast?: string
}

export function LazyFeaturedProductCarousel({
  productHandleToMoveLast
}: LazyFeaturedProductCarouselProps) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductCarousel
        {...(productHandleToMoveLast ?
          { productHandleToMoveLast }
        : {})}
      />
    </Suspense>
  )
}
