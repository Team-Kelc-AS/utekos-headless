'use client'

import { ProductCard } from '@/components/ProductCard/ProductCard'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { createColorHexMap } from '@/lib/helpers/shared/createColorHexMap'
import { initializeCarouselProducts } from '@/components/ProductCard/initializeCarouselProducts'
import type { RelatedProductsProps } from 'types/product/ProductTypes'

export function RelatedProducts({
  products
}: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null
  }

  const productOptionsMap = initializeCarouselProducts(products)

  return (
    <article className='mt-8 rounded-[1.75rem] bg-transparent px-6 py-12 md:py-16'>
      <div className='mb-8 text-left md:mb-12 lg:mb-16'>
        <h2 className='font-google-sans font-sans text-6xl font-bold text-foreground md:text-7xl'>
          Favoritter blant andre livsnytere
        </h2>
      </div>
      <Carousel
        slideCount={products.length}
        ssr={CAROUSEL_SSR.productGrid(products.length)}
        opts={{ align: 'start', loop: true }}
        className='mt-4 w-full lg:mt-8'
      >
        <CarouselContent className='-ml-4'>
          {products.map((product, index) => {
            const colorHexMap = createColorHexMap(product)
            const initialOptions = productOptionsMap.get(
              product.handle
            )

            return (
              <CarouselItem
                key={product.id}
                className='h-auto basis-[72%] pl-4 sm:basis-1/2 md:basis-[40%] xl:basis-1/3'
              >
                <ProductCard
                  product={product}
                  colorHexMap={colorHexMap}
                  isPriority={index < 4}
                  initialOptions={initialOptions ?? {}}
                  compactMobile
                />
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious className='dark:border-dark-sidebar-foreground dark:hover:text-dark-sidebar-foreground left-2 border-sidebar-foreground bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar hover:text-sidebar-foreground' />
        <CarouselNext className='dark:border-dark-sidebar-foreground dark:hover:text-dark-sidebar-foreground right-2 border-sidebar-foreground bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar hover:text-sidebar-foreground' />
      </Carousel>
    </article>
  )
}
