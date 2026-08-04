// Path: src/components/frontpage/PromiseSection.tsx
'use client'

import React from 'react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import TechDownKateKikkert from '@/assets/images/techdown/techdown-kate-kikkert-1080.webp'
import ClassicGeminiWoman from '@/assets/images/mikrofiber/kaffe-med-tilpasset-utekos-mikrofiber-vinter-terrasse-.webp'
import TechDownMonica from '@/assets/images/techdown/techdown-monica-1080.webp'
import TechDownKristoffer from '@/assets/images/techdown/techdown-kristoffer-1080.webp'
import { PageSection } from '@/components/layout/PageSection'
import { cn } from '@/lib/utils/className'

const images = [
  {
    src: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/JUSTER-FORM-NYT-DARK-1080x1080.png',
    alt: 'JUSTER, FORM OG NYT.'
  },
  {
    src: TechDownKateKikkert,
    alt: 'En fornøyd kvinne som bruker Utekos-produktet på terrassen.'
  },
  {
    src: ClassicGeminiWoman,
    alt: 'En kvinne som bruker Utekos-produktet i snørike omgivelser.'
  },
  {
    src: TechDownMonica,
    alt: 'En fornøyd kvinne som bruker Utekos TechDown ved bålbannen.'
  },
  {
    src: TechDownKristoffer,
    alt: 'En fornøyd herre som bruker Utekos TechDown på terrassen.'
  }
]

export function PromiseSection() {
  const [plugin] = React.useState(() =>
    Autoplay({ delay: 3000 })
  )

  return (
    <PageSection
      as='section'
      background='default'
      className={cn('mx-auto overflow-hidden rounded-t-xl')}
    >
      <div className='mx-auto'>
        <div className='grid grid-cols-1 gap-12'>
          {/* Karusell: Vises kun på mobil (skjules fra md og oppover) */}
          <div className='relative flex items-center justify-center rounded-xl border border-neutral-800 p-2 md:hidden'>
            <Carousel
              plugins={[plugin]}
              className='w-full'
              slideCount={images.length}
              opts={{ loop: true }}
              aria-label='Løfte-bildekarusell'
            >
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className='overflow-hidden rounded-lg'>
                      <div className='relative aspect-square w-full'>
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={1080}
                          height={1080}
                          quality={95}
                          className='object-cover'
                          sizes='100vw'
                          priority={index === 0}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious
                forceVisible
                aria-label='Forrige bilde'
                className='dark:border-dark-card-foreground/35 -foreground -foreground dark:hover:text-dark-card dark:focus-visible:outline-dark-card-foreground absolute top-1/2 left-3 z-20 size-10 -translate-y-1/2 border-card-foreground/35 bg-card-foreground text-card shadow-lg hover:bg-card-foreground hover:text-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
              />
              <CarouselNext
                forceVisible
                aria-label='Neste bilde'
                className='dark:border-dark-card-foreground/35 -foreground -foreground dark:hover:text-dark-card dark:focus-visible:outline-dark-card-foreground absolute top-1/2 right-3 z-20 size-10 -translate-y-1/2 border-card-foreground/35 bg-card-foreground text-card shadow-lg hover:bg-card-foreground hover:text-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
              />
            </Carousel>
          </div>

          <div className='border-coral-green relative hidden overflow-hidden rounded-xl border md:block'>
            <div className='aspect-video overflow-hidden rounded-lg'>
              <div className='relative w-full'>
                <Image
                  src='https://cdn.shopify.com/s/files/1/0634/2154/6744/files/JUSTER-FORM-NYT-1920-1080.png'
                  alt='JUSTER, FORM OG NYT.'
                  width={1980}
                  height={1080}
                  quality={100}
                  className='h-auto w-full object-cover'
                  sizes='100vw, 1980px'
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  )
}
