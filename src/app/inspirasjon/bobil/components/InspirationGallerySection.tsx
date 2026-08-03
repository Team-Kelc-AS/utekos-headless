// Path: src/app/inspirasjon/bobil/sections/InspirationGallerySection.tsx

import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { galleryImages } from '../utils/galleryImages'

export function InspirationGallerySection() {
  return (
    <article className='dark:bg-dark-background bg-background py-24 text-foreground'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-3xl text-center md:max-w-4xl'>
          <h2 className='inline-flex items-baseline justify-center gap-x-[0.18em] whitespace-nowrap font-sans text-4xl font-extrabold text-foreground md:text-5xl'>
            Utekos i sitt rette element
          </h2>
          <p className='utekos-section-lead mx-auto my-8 max-w-2xl text-foreground/90'>
            Fra morgenkaffen i soloppgang til sene kvelder under
            stjernene. La deg inspirere av ekte øyeblikk fra
            bobillivet.
          </p>
        </div>

        <Carousel
          slideCount={galleryImages.length}
          ssr={CAROUSEL_SSR.responsiveThirds(
            galleryImages.length
          )}
          opts={{ loop: true, align: 'start' }}
          className='mx-auto w-full max-w-5xl'
        >
          <CarouselContent className='-ml-4'>
            {galleryImages.map(image => (
              <CarouselItem
                key={image.src}
                className='pl-4 md:basis-1/2 lg:basis-1/3'
              >
                <div className='group flex h-full flex-col p-1'>
                  <div className='relative aspect-square shrink-0 overflow-hidden rounded-lg border border-border bg-card'>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className='size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                    />
                  </div>
                  <div className='flex-1 pt-4 text-left'>
                    <h3 className='font-google-sans font-sans leading-[0.95] font-bold text-foreground'>
                      {image.title}
                    </h3>
                    <p className='leading-text-paragraph dark:text-dark-muted-foreground mt-2 text-sm text-muted-foreground'>
                      {image.description}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            aria-label='Forrige bilde'
            className='dark:bg-dark-background/90 dark:hover:bg-dark-background dark:focus-visible:ring-dark-ring dark:focus-visible:ring-offset-dark-background left-2 hidden border-border bg-background/90 text-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex'
          />
          <CarouselNext
            aria-label='Neste bilde'
            className='dark:bg-dark-background/90 dark:hover:bg-dark-background dark:focus-visible:ring-dark-ring dark:focus-visible:ring-offset-dark-background right-2 hidden border-border bg-background/90 text-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex'
          />
        </Carousel>
      </div>
    </article>
  )
}
