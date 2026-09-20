'use client'

import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import techDownOutdoorPortrait from '@public/TechDown_1080x1704px_Last.jpg'
import techDownPortraitSmile from '@public/1080×1704_02.jpg'
import techDownPortraitLookingAside from '@public/1080×1704_03.jpg'

const portraitFrameClassName =
  'bg-teal relative aspect-1080/1704 overflow-hidden rounded-2xl sm:rounded-[1.25rem]'

const images = [
  {
    src: techDownOutdoorPortrait,
    alt: 'Utekos TechDown™ i mørk blå, fotografert utendørs.'
  },
  {
    src: techDownPortraitSmile,
    alt: 'Utekos TechDown™ i mørk blå, fotografert utendørs med hette oppe.'
  },
  {
    src: techDownPortraitLookingAside,
    alt: 'Utekos TechDown™ i mørk blå, fotografert utendørs med hendene i lommene.'
  }
]

export function ImageColumn() {
  return (
    <figure className='relative mx-auto w-full max-w-110 sm:max-w-125 md:max-w-140 lg:max-w-155 xl:max-w-none'>
      <div className='relative'>
        <Carousel
          slideCount={images.length}
          opts={{ loop: true }}
          className='group w-full'
          role='group'
          aria-roledescription='bildekarusell'
          aria-label='Produktbilder av Utekos TechDown'
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={image.alt} className='h-fit'>
                <div className={portraitFrameClassName}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    quality={80}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding='async'
                    className='object-cover object-center'
                    sizes='(max-width: 640px) calc(100vw - 56px), (max-width: 768px) 560px, (max-width: 1280px) 620px, (max-width: 1536px) 45vw, 540px'
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious
            aria-label='Forrige produktbilde'
            className="absolute top-1/2 left-2 z-20 size-8 -translate-y-1/2 cursor-pointer border border-sidebar-foreground bg-jungle text-sidebar-foreground shadow-none transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-jungle hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-foreground sm:left-3 sm:size-10 [&_svg]:size-3.5! sm:[&_svg]:size-4!"
          />

          <CarouselNext
            aria-label='Neste produktbilde'
            className="absolute top-1/2 right-2 z-20 size-8 -translate-y-1/2 cursor-pointer border border-sidebar-foreground bg-jungle text-sidebar-foreground shadow-none transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-jungle hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-foreground sm:right-3 sm:size-10 [&_svg]:size-3.5! sm:[&_svg]:size-4!"
          />
        </Carousel>
      </div>

      <figcaption className='sr-only'>
        Bildekarusell med {images.length} produktbilder av Utekos
        TechDown.
      </figcaption>
    </figure>
  )
}
