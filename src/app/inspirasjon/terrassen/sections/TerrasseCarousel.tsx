// Path: src/app/inspirasjon/terrassen/sections/TerrasseCarousel.tsx

'use client'

import Image from 'next/image'
import { Camera } from 'lucide-react'
import * as React from 'react'
import Autoplay from 'embla-carousel-autoplay'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { terrasseImages } from '@/app/inspirasjon/terrassen/images/terrasseImages'
import type { CarouselApi } from '@/components/ui/carousel'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { cn } from '@/lib/utils/className'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { H2 } from '@/components/typography/TypographyH2'

export function TerrasseCarousel() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  const [autoplayPlugin] = React.useState(() =>
    Autoplay({ delay: 4000, defaultInteraction: false })
  )

  React.useEffect(() => {
    if (!api) {
      return
    }

    const onSelect = () => {
      setCurrent(api.selectedSnap() + 1)
    }

    queueMicrotask(onSelect)
    api.on('select', onSelect)

    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  React.useEffect(() => {
    if (!api) {
      return
    }

    const media = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )

    const syncAutoplay = () => {
      const autoplay = api.plugins().autoplay

      if (!autoplay) {
        return
      }

      if (media.matches) {
        autoplay.stop()
        return
      }

      autoplay.play()
    }

    syncAutoplay()
    media.addEventListener('change', syncAutoplay)

    return () => {
      media.removeEventListener('change', syncAutoplay)
      api.plugins().autoplay?.stop()
    }
  }, [api])

  const stopAutoplay = () => {
    api?.plugins().autoplay?.stop()
  }

  const resumeAutoplay = () => {
    const shouldReduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (shouldReduceMotion) {
      return
    }

    api?.plugins().autoplay?.play()
  }

  return (
    <article className='relative isolate mx-auto overflow-hidden bg-[var(--terrace-night)] px-4 py-20 text-[var(--terrace-cream)] sm:py-32'>
      <div className='container mx-auto max-w-7xl'>
        <div className='mb-12 max-w-4xl text-left'>
          <BrandBadge
            backgroundColor='var(--jungle)'
            textColor='var(--foreground)'
            className='mb-4 gap-2 border border-[var(--terrace-line-dark)] px-4 py-2 font-utekos-text text-sm leading-4 shadow-none'
          >
            <Camera className='size-4' aria-hidden='true' />
            <span className='inline-flex items-baseline gap-[0.28em] leading-none'>
              <span className='text-[0.95em]'>
                Terrasselivet med
              </span>
              <UtekosWordmark className='inline-block h-[0.78em] w-auto translate-y-[0.035em] text-current' />
            </span>
          </BrandBadge>

          <H2
            ID='terrasse-bildekarusell'
            Text='Forleng dine beste øyeblikk'
            className='mt-4 pb-0 text-left text-[clamp(3rem,6vw,5.75rem)] leading-[0.95] text-[var(--terrace-cream)]'
          />
        </div>

        <div className='relative'>
          <div className='relative mx-auto max-w-6xl overflow-hidden rounded-lg border-none bg-jungle p-4 shadow-[0_32px_90px_-56px_rgb(0_0_0/0.9)] sm:p-6'>
            <div className='absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--terrace-copper),transparent)]' />

            <Carousel
              setApi={setApi}
              plugins={[autoplayPlugin]}
              slideCount={terrasseImages.length}
              ssr={CAROUSEL_SSR.responsiveThirds(
                terrasseImages.length
              )}
              onMouseEnter={stopAutoplay}
              onMouseLeave={resumeAutoplay}
              className='w-full'
              opts={{ align: 'start', loop: true }}
            >
              <CarouselContent className='-ml-4'>
                {terrasseImages.map(image => (
                  <CarouselItem
                    key={image.alt}
                    className='pl-4 md:basis-1/2 lg:basis-1/3'
                  >
                    <div className='group relative overflow-hidden rounded-lg border border-[var(--terrace-line-dark)] bg-transparent'>
                      <AspectRatio ratio={1 / 1}>
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className='object-cover transition-transform duration-700 will-change-transform group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100'
                          sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        />
                        <div className='absolute inset-0 bg-linear-to-t from-[rgb(16_32_31/0.76)] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none' />
                      </AspectRatio>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className='left-4 border-[var(--terrace-line-dark)] bg-[var(--terrace-control-light)] text-[var(--terrace-night)] backdrop-blur-md hover:bg-[var(--terrace-cream)] focus-visible:ring-[var(--terrace-copper)]' />
              <CarouselNext className='right-4 border-[var(--terrace-line-dark)] bg-[var(--terrace-control-light)] text-[var(--terrace-night)] backdrop-blur-md hover:bg-[var(--terrace-cream)] focus-visible:ring-[var(--terrace-copper)]' />
            </Carousel>

            <div className='mt-8 flex items-center justify-center gap-2'>
              {api?.snapList().map((_, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => api.goTo(index)}
                  className='flex size-8 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[var(--terrace-copper)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--terrace-night)] focus-visible:outline-none'
                  aria-current={
                    current === index + 1 ? 'true' : undefined
                  }
                  aria-label={`Gå til bilde ${index + 1}`}
                >
                  <span
                    className={cn(
                      'block h-2 rounded-full border transition-all duration-300 motion-reduce:transition-none',
                      current === index + 1 ?
                        'w-6 border-[var(--terrace-copper)] bg-[var(--terrace-copper)]'
                      : 'w-2 border-[var(--terrace-line-dark)] bg-[var(--terrace-cream)] hover:bg-[var(--terrace-sage-soft)]'
                    )}
                    aria-hidden='true'
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
