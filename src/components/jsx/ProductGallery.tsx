// Path: src/components/jsx/ProductGallery.tsx
'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { ProductGallerySlideImage } from '@/components/jsx/ProductGallerySlideImage'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { cn } from '@/lib/utils/className'
import type { ProductGalleryProps } from '@types'

export function ProductGallery({
  title,
  images,
  imageBackgroundClassName = '',
  imageClassName = '',
  imageLayout = 'cover-fill'
}: ProductGalleryProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <Carousel
      slideCount={images.length}
      ssr={CAROUSEL_SSR.fullWidth(images.length)}
      opts={{
        align: 'start',
        loop: images.length > 1
      }}
      className={cn(
        'absolute inset-0 touch-pan-y overflow-hidden rounded-none select-none',
        imageBackgroundClassName
      )}
      aria-label={`Produktbilder for ${title}`}
    >
      <CarouselContent className='ml-0 h-full'>
        {images.map((image, index) => (
          <CarouselItem
            key={resolveImageSrc(image.url)}
            className='relative h-full basis-full pl-0'
          >
            <ProductGallerySlideImage
              image={image}
              title={title}
              index={index}
              imageLayout={imageLayout}
              imageClassName={imageClassName}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      {images.length > 1 && (
        <>
          <CarouselPrevious className='dark:border-dark-sidebar-foreground dark:ring-dark-sidebar-foreground dark:hover:text-dark-sidebar-foreground left-2 border-sidebar-foreground bg-sidebar text-sidebar-foreground shadow-lg ring-1 ring-sidebar-foreground hover:bg-sidebar hover:text-sidebar-foreground' />

          <CarouselNext className='dark:border-dark-sidebar-foreground dark:ring-dark-sidebar-foreground dark:hover:text-dark-sidebar-foreground right-2 border-sidebar-foreground bg-sidebar text-sidebar-foreground shadow-lg ring-1 ring-sidebar-foreground hover:bg-sidebar hover:text-sidebar-foreground' />
        </>
      )}
    </Carousel>
  )
}
