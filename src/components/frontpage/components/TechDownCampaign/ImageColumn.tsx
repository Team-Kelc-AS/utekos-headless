'use client'

import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import kvinneNyterTerrasselivetMedUtekosTechdown from '@/assets/images/techdown/kvinne-nyter-terrasselivet-med-utekos-techdown.webp'
import utekosTechdownBaksideFullmodus16001793 from '@/assets/images/techdown/utekos-techdown-bakside-fullmodus-1600-1793.webp'
import utekosTechdownDiagonaltFullfigur from '@/assets/images/techdown/utekos-techdown-diagonalt-fullfigur.webp'

const images = [
  {
    src: utekosTechdownDiagonaltFullfigur,
    alt: 'Utekos TechDown diagonalt fullfigur',
    imageClassName: 'object-contain object-center p-1 sm:p-0'
  },
  {
    src: kvinneNyterTerrasselivetMedUtekosTechdown,
    alt: 'Utekos TechDown i bruk på en terrasse',
    imageClassName: 'object-cover object-center'
  },
  {
    src: utekosTechdownBaksideFullmodus16001793,
    alt: 'Utekos TechDown sett bakfra',
    imageClassName: 'object-contain object-center p-1 sm:p-0'
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
                <div className='bg-teal relative aspect-square overflow-hidden rounded-2xl sm:aspect-3/4 sm:rounded-[1.25rem] lg:aspect-3/4'>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    quality={80}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding='async'
                    className={image.imageClassName}
                    sizes='(max-width: 640px) calc(100vw - 56px), (max-width: 768px) 560px, (max-width: 1280px) 620px, (max-width: 1536px) 45vw, 540px'
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious
            aria-label='Forrige produktbilde'
            className="dark:border-dark-sidebar-foreground dark:hover:text-dark-sidebar-foreground dark:focus-visible:outline-dark-sidebar-foreground absolute top-1/2 left-2 z-20 size-8 -translate-y-1/2 cursor-pointer border border-sidebar-foreground bg-sidebar text-sidebar-foreground shadow-none transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-sidebar hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-foreground sm:left-3 sm:size-10 [&_svg]:size-3.5! sm:[&_svg]:size-4!"
          />

          <CarouselNext
            aria-label='Neste produktbilde'
            className="dark:border-dark-sidebar-foreground dark:hover:text-dark-sidebar-foreground dark:focus-visible:outline-dark-sidebar-foreground absolute top-1/2 right-2 z-20 size-8 -translate-y-1/2 cursor-pointer border border-sidebar-foreground bg-sidebar text-sidebar-foreground shadow-none transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-sidebar hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-foreground sm:right-3 sm:size-10 [&_svg]:size-3.5! sm:[&_svg]:size-4!"
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
