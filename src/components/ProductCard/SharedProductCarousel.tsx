'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { createColorHexMap } from '@/lib/helpers/shared/createColorHexMap'
import { cn } from '@/lib/utils/className'
import { initializeCarouselProducts } from './initializeCarouselProducts'
import { ProductCard } from './ProductCard'
import type { ShopifyProduct } from 'types/product'

interface SharedProductCarouselProps {
  products: ShopifyProduct[]
  navigationClassName?: string
  cardClassName?: string
  itemListId: string
  itemListName: string
}

export function SharedProductCarousel({
  products,
  navigationClassName,
  cardClassName,
  itemListId,
  itemListName
}: SharedProductCarouselProps) {
  if (products.length === 0) {
    return null
  }

  const productOptionsMap = initializeCarouselProducts(products)

  return (
    <Carousel
      slideCount={products.length}
      ssr={CAROUSEL_SSR.mobilePeekHalvesAndThirds(
        products.length
      )}
      opts={{ align: 'start', loop: products.length > 3 }}
      className='w-full'
    >
      <CarouselContent className='-ml-3 md:-ml-8 lg:-ml-10'>
        {products.map(product => {
          const colorHexMap = createColorHexMap(product)
          const initialOptions =
            productOptionsMap.get(product.handle) ??
            ({} as Record<string, string>)

          return (
            <CarouselItem
              key={product.id}
              className='basis-[72%] pl-3 sm:basis-1/2 md:basis-[38%] md:pl-8 lg:pl-10 xl:basis-1/3'
            >
              <ProductCard
                product={product}
                colorHexMap={colorHexMap}
                initialOptions={initialOptions}
                compactMobile
                itemListId={itemListId}
                itemListName={itemListName}
                itemListTotalCount={products.length}
                {...(cardClassName ? { cardClassName } : {})}
              />
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious
        forceVisible
        className={cn(
          'top-[34%] left-1.5 z-20 flex border-background bg-foreground text-background shadow-lg ring-1 ring-background/45 backdrop-blur-sm hover:bg-foreground/90 disabled:opacity-70 md:hidden [&_svg]:size-5'
        )}
      />
      <CarouselNext
        forceVisible
        className={cn(
          'top-[34%] right-1.5 z-20 flex border-background bg-foreground text-background shadow-lg ring-1 ring-background/45 backdrop-blur-sm hover:bg-foreground/90 disabled:opacity-70 md:hidden [&_svg]:size-5'
        )}
      />
      <CarouselPrevious
        className={cn(
          'max-md:hidden md:left-2 xl:-left-12',
          navigationClassName
        )}
      />
      <CarouselNext
        className={cn(
          'max-md:hidden md:right-2 xl:-right-12',
          navigationClassName
        )}
      />
    </Carousel>
  )
}
