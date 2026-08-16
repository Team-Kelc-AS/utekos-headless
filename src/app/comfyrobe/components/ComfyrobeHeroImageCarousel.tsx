'use client'

import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import type { ComfyrobeHeroGallerySlide } from '../data/comfyrobeHeroGallery'

type ComfyrobeHeroImageCarouselProps = {
  slides: readonly ComfyrobeHeroGallerySlide[]
  sizes: string
  imageClassName: string
  preloadFirst?: boolean
}

export function ComfyrobeHeroImageCarousel({
  slides,
  sizes,
  imageClassName,
  preloadFirst = false
}: ComfyrobeHeroImageCarouselProps) {
  return (
    <Carousel
      slideCount={slides.length}
      opts={{
        loop: true,
        align: 'center',

        // Embla v9.
        // true er default, men eksplisitt her fordi swipe er
        // en bevisst del av komponentens kontrakt.
        draggable: true,

        // Behold snap-per-bilde i stedet for fri momentum-scroll.
        dragFree: false
      }}
      aria-label='Comfyrobe herobilder'
      className='relative size-full'
    >
      <CarouselContent className='ml-0 h-full'>
        {slides.map((slide, index) => (
          <CarouselItem
            key={slide.id}
            className='h-full basis-full pl-0'
          >
            <div className='relative size-full overflow-hidden bg-jungle'>
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes={sizes}
                quality={75}
                preload={preloadFirst && index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                className={imageClassName}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious
        forceVisible
        aria-label='Forrige bilde'
        className='left-3 z-10 size-14 border-foreground/15 bg-background/85 text-foreground shadow-lg backdrop-blur-md hover:bg-background [&_svg]:size-6!'
      />

      <CarouselNext
        forceVisible
        aria-label='Neste bilde'
        className='right-3 z-10 size-14 border-foreground/15 bg-background/85 text-foreground shadow-lg backdrop-blur-md hover:bg-background [&_svg]:size-6!'
      />
    </Carousel>
  )
}
