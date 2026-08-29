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
import { ProductDesktopGalleryFrame } from '@/app/produkter/[handle]/components/ProductDesktopGalleryFrame'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { cn } from '@/lib/utils/className'
import type { ProductGalleryProps } from '@types'

const galleryControlClassName =
  'border border-sidebar-foreground bg-sidebar text-sidebar-foreground shadow-none hover:bg-sidebar hover:text-sidebar-foreground dark:border-sidebar-foreground dark:hover:text-sidebar-foreground'

export function ProductGallery({
  title,
  images,
  imageBackgroundClassName = '',
  imageClassName = '',
  imageLayout = 'cover-fill',
  framed = false
}: ProductGalleryProps) {
  if (images.length === 0) {
    return null
  }

  const slides = images.map((image, index) => (
    <CarouselItem
      key={resolveImageSrc(image.url)}
      className={cn(
        'relative h-full basis-full pl-0',
        framed && 'overflow-clip bg-jungle'
      )}
    >
      {framed ?
        <div className='absolute -inset-px'>
          <ProductGallerySlideImage
            image={image}
            title={title}
            index={index}
            imageLayout={imageLayout}
            imageClassName={imageClassName}
          />
        </div>
      : <ProductGallerySlideImage
          image={image}
          title={title}
          index={index}
          imageLayout={imageLayout}
          imageClassName={imageClassName}
        />
      }
    </CarouselItem>
  ))

  const controls =
    images.length > 1 ?
      <>
        <CarouselPrevious
          forceVisible
          className={cn(
            galleryControlClassName,
            framed ? 'left-4' : 'left-2'
          )}
        />
        <CarouselNext
          forceVisible
          className={cn(
            galleryControlClassName,
            framed ? 'right-0 translate-x-1/2' : 'right-2'
          )}
        />
      </>
    : null

  if (framed) {
    return (
      <Carousel
        slideCount={images.length}
        ssr={CAROUSEL_SSR.fullWidth(images.length)}
        opts={{ align: 'start', loop: images.length > 1 }}
        className='relative w-full touch-pan-y select-none'
        aria-label={`Produktbilder for ${title}`}
      >
        <ProductDesktopGalleryFrame overlay={controls}>
          <div className='absolute inset-0 bg-jungle'>
            <CarouselContent className='ml-0 h-full bg-jungle'>
              {slides}
            </CarouselContent>
          </div>
        </ProductDesktopGalleryFrame>
      </Carousel>
    )
  }

  return (
    <Carousel
      slideCount={images.length}
      ssr={CAROUSEL_SSR.fullWidth(images.length)}
      opts={{ align: 'start', loop: images.length > 1 }}
      className={cn(
        'absolute inset-0 touch-pan-y overflow-hidden rounded-none select-none',
        imageBackgroundClassName
      )}
      aria-label={`Produktbilder for ${title}`}
    >
      <CarouselContent className='ml-0 h-full'>
        {slides}
      </CarouselContent>
      {controls}
    </Carousel>
  )
}
