// Path: src/app/skreddersy-varmen/components/LandingPageProductCarouselPurchaseSection.tsx
'use client'

import Image from 'next/image'
import Fade from 'embla-carousel-fade'
import TechDownTerraceImage from '@/assets/images/techdown/TechDown-Terrasse-2048x2720.webp'
import { cn } from '@/lib/utils/className'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { focusRing } from '../utils/constants'
import { PRODUCT_VARIANTS } from '@/api/constants'

const TECHDOWN_IMAGE_ALTS = [
  'Person som sitter på en terrasse i mørkeblå Utekos TechDown™.',
  'Mørkeblå Utekos TechDown™ i fullengdemodus sett skrått forfra.',
  'Mørkeblå Utekos TechDown™ i fullengdemodus sett bakfra.',
  'Mørkeblå Utekos TechDown™ sett forfra i oppjustert modus.'
] as const

export function LandingPageProductCarouselPurchaseSection() {
  const currentConfig = PRODUCT_VARIANTS['utekos-techdown']
  const galleryImages = [
    TechDownTerraceImage,
    ...currentConfig.images.slice(1)
  ]

  return (
    <div className='dark:bg-dark-background relative flex w-full flex-col items-center justify-center bg-background min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-svh min-[900px]:self-start min-[900px]:p-8 min-[1280px]:p-12'>
      <BrandBadge
        tone='promo'
        className='animate-in fade-in slide-in-from-left-2 dark:bg-dark-primary dark:text-dark-primary-foreground absolute top-4 left-4 z-20 bg-primary px-4 py-1.5 font-utekos-text-medium text-xs tracking-normal text-primary-foreground shadow-lg duration-500 min-[900px]:top-8 min-[900px]:left-8 min-[1280px]:top-12 min-[1280px]:left-12'
      >
        <span className='whitespace-nowrap'>
          {currentConfig.badge}
        </span>
      </BrandBadge>

      <Carousel
        slideCount={galleryImages.length}
        ssr={CAROUSEL_SSR.fullWidth(galleryImages.length)}
        opts={{ loop: galleryImages.length > 1, duration: 35 }}
        plugins={galleryImages.length > 1 ? [Fade()] : []}
        className='relative w-full min-[900px]:max-w-xl'
      >
        <CarouselContent className='ml-0'>
          {galleryImages.map((src, i) => {
            const imageAlt =
              TECHDOWN_IMAGE_ALTS[i] ??
              `${currentConfig.title} sett fra en ny vinkel.`

            return (
              <CarouselItem
                key={typeof src === 'string' ? src : src.src}
                className='relative aspect-4/5 pl-0 md:aspect-3/4'
              >
                <div className='dark:min-[900px]:ring-dark-background/10 relative size-full overflow-hidden min-[900px]:rounded-2xl min-[900px]:shadow-2xl min-[900px]:ring-1 min-[900px]:ring-background/10'>
                  <Image
                    src={src}
                    alt={imageAlt}
                    fill
                    className='object-cover'
                    sizes='(max-width: 899px) 100vw, 40vw'
                    preload={i === 0}
                  />
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {galleryImages.length > 1 && (
          <>
            <CarouselPrevious
              aria-label='Forrige bilde'
              className={cn(
                'dark:border-dark-background/15 dark:bg-dark-foreground/90 dark:text-dark-background dark:hover:bg-dark-foreground dark:hover:text-dark-primary left-2 size-10 border-background/15 bg-foreground/90 text-background shadow-md backdrop-blur-md hover:bg-foreground hover:text-primary md:left-4 md:size-11',
                focusRing
              )}
            />
            <CarouselNext
              aria-label='Neste bilde'
              className={cn(
                'dark:border-dark-background/15 dark:bg-dark-foreground/90 dark:text-dark-background dark:hover:bg-dark-foreground dark:hover:text-dark-primary right-2 size-10 border-background/15 bg-foreground/90 text-background shadow-md backdrop-blur-md hover:bg-foreground hover:text-primary md:right-4 md:size-11',
                focusRing
              )}
            />
          </>
        )}
      </Carousel>
    </div>
  )
}
