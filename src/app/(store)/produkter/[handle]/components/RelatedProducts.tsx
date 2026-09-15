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
import { cn } from '@/lib/utils/className'
import type { RelatedProductsProps } from 'types/product/ProductTypes'

const relatedCarouselControlClassName =
  'pointer-events-auto top-1/2 z-20 -translate-y-1/2 border-foreground/20 bg-night text-foreground shadow-md hover:bg-night hover:text-foreground'

export function RelatedProducts({
  products
}: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null
  }

  const productOptionsMap = initializeCarouselProducts(products)

  return (
    <article className='mt-8 bg-primary pt-12 pb-16 md:py-16'>
      <div className='container mx-auto px-4 md:px-8'>
        <div className='mb-8 text-left md:mb-12 lg:mb-16'>
          <h2 className='font-google-sans font-sans text-3xl font-bold text-foreground md:text-4xl'>
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
                  className='h-auto basis-[86%] pl-4 sm:basis-1/2 md:basis-[40%] xl:basis-1/3'
                >
                  <ProductCard
                    product={product}
                    colorHexMap={colorHexMap}
                    isPriority={index < 4}
                    initialOptions={initialOptions ?? {}}
                    compactMobile
                    itemListId='related_products'
                    itemListName='Relaterte produkter'
                    itemListTotalCount={products.length}
                  />
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <div className='pointer-events-none absolute inset-x-0 top-0 z-20'>
            <div className='relative w-full'>
              <div className='aspect-square w-[calc(86%-1rem)] sm:w-[calc(50%-1rem)] md:w-[calc(40%-1rem)] xl:w-[calc(33.333%-1rem)]' />
              <CarouselPrevious
                className={cn(
                  relatedCarouselControlClassName,
                  'left-2'
                )}
              />
              <CarouselNext
                className={cn(
                  relatedCarouselControlClassName,
                  'right-2'
                )}
              />
            </div>
          </div>
        </Carousel>
      </div>
    </article>
  )
}
