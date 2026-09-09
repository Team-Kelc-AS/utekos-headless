'use client'

import Fade from 'embla-carousel-fade'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { cn } from '@/lib/utils/className'
import { focusRing } from '../utils/constants'
import {
  landingGalleryButtonClassName,
  type LandingPurchaseGalleryCarouselProps
} from './landingGalleryShared'

export function LandingPurchaseGalleryCarousel({
  slides,
  initialIndex
}: LandingPurchaseGalleryCarouselProps) {
  return (
    <Carousel
      aria-label='Produktbilder'
      slideCount={slides.length}
      ssr={CAROUSEL_SSR.fullWidth(slides.length)}
      opts={{
        loop: slides.length > 1,
        duration: 35,
        startSnap: initialIndex
      }}
      plugins={slides.length > 1 ? [Fade()] : []}
      className='relative w-full'
    >
      <CarouselContent className='ml-0'>
        {slides.map((slide, index) => (
          <CarouselItem key={index} className='relative pl-0'>
            {slide}
          </CarouselItem>
        ))}
      </CarouselContent>

      {slides.length > 1 && (
        <>
          <CarouselPrevious
            aria-label='Forrige bilde'
            className={cn(
              'left-2 md:left-4',
              landingGalleryButtonClassName,
              focusRing
            )}
          />
          <CarouselNext
            aria-label='Neste bilde'
            className={cn(
              'right-2 md:right-4',
              landingGalleryButtonClassName,
              focusRing
            )}
          />
        </>
      )}
    </Carousel>
  )
}
