// Path: src/app/produkter/(oversikt)/components/MicrofiberSection/MikrofiberImageSection.tsx

'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import Image from 'next/image'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'
import utekosMikrofiberBaksideFullFigur16001600 from '@/assets/images/mikrofiber/utekos-mikrofiber-bakside-full-figur-1600-1600.webp'
import utekosMikrofiberHalvfigurForside16001600 from '@/assets/images/mikrofiber/utekos-mikrofiber-halvfigur-forside-1600-1600.webp'
import utekosMikrofiberHelfigur16001600 from '@/assets/images/mikrofiber/utekos-mikrofiber-helfigur-1600-1600.webp'
import utekosMikrofiberKvinnerNyterSkogen16001600 from '@/assets/images/mikrofiber/utekos-mikrofiber-kvinner-nyter-skogen-1600-1600.webp'
import utekosMikrofiberParNyterKaffeTerrasse16001600 from '@/assets/images/mikrofiber/utekos-mikrofiber-par-nyter-kaffe-terrasse-1600-1600.webp'
import utekosMikrofiberParkas16001600 from '@/assets/images/mikrofiber/utekos-mikrofiber-parkas-1600-1600.webp'


const MICROFIBER_IMAGES = [
  {
    src: utekosMikrofiberKvinnerNyterSkogen16001600,
    alt: 'Kvinner nyter skogen med Utekos Mikrofiber.'
  },
  {
    src: utekosMikrofiberParNyterKaffeTerrasse16001600,
    alt: 'Par nyter kaffe med Utekos Mikrofiber på terrassen vinterstid'
  },
  {
    src: utekosMikrofiberHelfigur16001600,
    alt: 'Utekos Mikrofiber vist som fullfigur forfra.'
  },
  {
    src: utekosMikrofiberParkas16001600,
    alt: 'Utekos Mikrofiber vist i parkasmodus forfra.'
  },
  {
    src: utekosMikrofiberHalvfigurForside16001600,
    alt: 'Utekos Mikrofiber vist som åpen halvfigur forfra.'
  },
  {
    src: utekosMikrofiberBaksideFullFigur16001600,
    alt: 'Utekos Mikrofiber vist som helfigur bakfra.'
  }
] as const

export function MikrofiberImageSection() {
  const [ref, isInView] = useInView({ threshold: 0.5 })

  return (
    <div
      ref={ref}
      className={cn(
        'will-animate-fade-in-scale relative h-full min-h-full',
        isInView && 'is-in-view'
      )}
    >
      <Carousel
        className='aspect-square w-full overflow-hidden'
        slideCount={MICROFIBER_IMAGES.length}
        opts={{ align: 'start', loop: true }}
      >
        <CarouselContent className='h-full'>
          {MICROFIBER_IMAGES.map((image, index) => (
            <CarouselItem key={image.alt} className='h-full'>
              <div className='relative aspect-square w-full overflow-hidden rounded-xl'>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className='rounded-xl object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100'
                  sizes='(max-width: 1024px) 92vw, 40vw'
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className='dark:border-dark-background/10 dark:text-dark-background dark:hover:bg-dark-primary dark:focus-visible:ring-dark-primary/70 left-4 hidden border-background/10 bg-foreground/86 text-background backdrop-blur-md hover:bg-primary focus-visible:ring-primary/70 sm:inline-flex' />
        <CarouselNext className='dark:border-dark-background/10 dark:text-dark-background dark:hover:bg-dark-primary dark:focus-visible:ring-dark-primary/70 right-4 hidden border-background/10 bg-foreground/86 text-background backdrop-blur-md hover:bg-primary focus-visible:ring-primary/70 sm:inline-flex' />
      </Carousel>
    </div>
  )
}
