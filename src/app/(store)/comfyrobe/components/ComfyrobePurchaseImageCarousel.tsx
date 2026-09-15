'use client'

import Fade from 'embla-carousel-fade'
import { useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { COMFYROBE_PURCHASE_GALLERY } from '../data/comfyrobePurchaseGallery'
import { ComfyrobeResponsiveImage } from './ComfyrobeResponsiveImage'

const PACKSHOT_BACKDROP = 'oklch(0.8767 0.0086 56.3)'

export function ComfyrobePurchaseImageCarousel() {
  const [fadePlugin] = useState(() => Fade())

  return (
    <div className='relative min-h-0 bg-muted lg:h-full lg:min-h-full'>
      <Carousel
        plugins={[fadePlugin]}
        slideCount={COMFYROBE_PURCHASE_GALLERY.length}
        opts={{
          loop: true,
          align: 'center'
        }}
        aria-label='Comfyrobe produktbilder'
        className='relative h-full w-full'
      >
        <div className='relative aspect-4/5 w-full overflow-hidden lg:absolute lg:inset-0 lg:h-full lg:aspect-auto'>
          <CarouselContent className='absolute inset-0 ml-0 h-full'>
            {COMFYROBE_PURCHASE_GALLERY.map((slide) => {
              const isPackshot = slide.fit === 'contain'

              const fitClass =
                isPackshot ?
                  'object-contain object-center'
                : 'object-cover object-center'

              return (
                <CarouselItem
                  key={slide.id}
                  className='absolute inset-0 basis-full pl-0'
                >
                  <div
                    className={
                      isPackshot ?
                        'relative size-full overflow-hidden bg-white-sand'
                      : 'relative size-full overflow-hidden bg-muted'
                    }
                    style={
                      isPackshot ?
                        {
                          backgroundColor: PACKSHOT_BACKDROP
                        }
                      : undefined
                    }
                  >
                    <ComfyrobeResponsiveImage
                      alt={slide.alt}
                      mobileSrc={slide.mobileSrc}
                      tabletSrc={slide.ipadSrc}
                      desktopSrc={slide.desktopSrc}
                      sizes='(min-width: 64rem) 50vw, 100vw'
                      className={fitClass}
                      quality={85}
                    />
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </div>

        <CarouselPrevious
          forceVisible
          aria-label='Forrige produktbilde'
          className='left-3 size-14 border-foreground/15 bg-background/85 text-foreground shadow-lg backdrop-blur-md hover:bg-background md:left-5 md:size-10 [&_svg]:size-6! md:[&_svg]:size-5!'
        />

        <CarouselNext
          forceVisible
          aria-label='Neste produktbilde'
          className='right-3 size-14 border-foreground/15 bg-background/85 text-foreground shadow-lg backdrop-blur-md hover:bg-background md:right-5 md:size-10 [&_svg]:size-6! md:[&_svg]:size-5!'
        />
      </Carousel>
    </div>
  )
}