'use client'

import Image from 'next/image'
import { useState } from 'react'
import Fade from 'embla-carousel-fade'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { COMFYROBE_PURCHASE_GALLERY } from '../data/comfyrobePurchaseGallery'

/** Matches brand token `white-sand` / lys sand. */
const PACKSHOT_BACKDROP = 'oklch(0.8767 0.0086 56.3)'

/** Portrait crops from iPad token through landscape tablets / small laptops. */
const IPAD_MEDIA = '(min-width: 51rem) and (max-width: 85rem)'

/** Square crops on large desktop viewports. */
const DESKTOP_MEDIA = '(min-width: 85.0625rem)'

export function ComfyrobePurchaseImageCarousel() {
  const [fadePlugin] = useState(() => Fade())

  return (
    <div className='relative min-h-0 bg-muted lg:h-full lg:min-h-full'>
      <Carousel
        plugins={[fadePlugin]}
        slideCount={COMFYROBE_PURCHASE_GALLERY.length}
        opts={{ loop: true, align: 'center' }}
        aria-label='Comfyrobe produktbilder'
        className='relative h-full w-full'
      >
        <div className='relative aspect-4/5 w-full overflow-hidden mamax-lg:min-[51rem]:aspect-1080/1350g:absolute lg:inset-0 lg:aspect-auto lg:h-full'>
          <CarouselContent className='absolute inset-0 ml-0 h-full'>
            {COMFYROBE_PURCHASE_GALLERY.map((slide, index) => {
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
                        { backgroundColor: PACKSHOT_BACKDROP }
                      : undefined
                    }
                  >
                    <picture className='absolute inset-0 block'>
                      <source
                        media={DESKTOP_MEDIA}
                        srcSet={slide.desktopSrc.src}
                      />
                      <source
                        media={IPAD_MEDIA}
                        srcSet={slide.ipadSrc.src}
                      />
                      <Image
                        src={slide.mobileSrc}
                        alt={slide.alt}
                        fill
                        priority={index === 0}
                        quality={90}
                        sizes='(max-width: 815px) 100vw, (max-width: 1023px) 100vw, 50vw'
                        className={fitClass}
                      />
                    </picture>
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
