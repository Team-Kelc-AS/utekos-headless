// Path: src/components/about/AboutCarousel.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import Autoplay from 'embla-carousel-autoplay'
import { aboutImages } from './aboutImages'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { type CarouselApi } from '@/components/ui/carousel'
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
import { motion, type Variants } from 'motion/react'
import { SectionBox } from '../layout/SectionBox'

const revealVariants: Variants = {
  hidden: { y: 28, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export function AboutCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const containerRef = useRef<HTMLElement>(null)

  const [autoplayPlugin] = useState(() =>
    Autoplay({ delay: 4000, defaultInteraction: false })
  )

  useEffect(() => {
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

  return (
    <SectionBox
      bgcolor='bg-background'
      className='border-b border-border'
    >
      <article ref={containerRef} className='relative'>
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <div className='absolute top-[18%] left-[18%] h-136 w-136 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-primary)_20%,transparent)_0%,transparent_70%)] blur-[110px]' />
          <div className='absolute right-[14%] bottom-[10%] h-120 w-120 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-accent)_16%,transparent)_0%,transparent_72%)] blur-[110px]' />
        </div>

        <div className='container'>
          <motion.div
            className='mb-16 text-left text-2xl'
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.35 }}
            transition={{ staggerChildren: 0.12 }}
          >
            <motion.div
              variants={revealVariants}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <BrandBadge
                backgroundColor='var(--color-primary)'
                textColor='var(--foreground)'
                className='mb-12 gap-2 font-utekos-text-medium! shadow-[0_18px_44px_-28px_color-mix(in_oklab,var(--color-primary)_80%,transparent)]'
              >
                <Camera className='size-5' strokeWidth={1.6} />
                <span>Livet med Utekos</span>
              </BrandBadge>
            </motion.div>

            <motion.h2
              variants={revealVariants}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1]
              }}
              className='font-google-sans mb-6 text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl'
            >
              Et glimt av opplevelsen
            </motion.h2>

            <motion.p
              variants={revealVariants}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1]
              }}
              className='font-utekos-text-medium text-foreground'
            >
              Se hvordan kompromissløs komfort gir liv til dine
              favorittøyeblikk utendørs.
            </motion.p>
          </motion.div>

          <motion.div
            className='relative'
            initial={{ y: 44, opacity: 0, scale: 0.98 }}
            whileInView={{ y: 0, opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.22 }}
            transition={{
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <div className='relative max-w-6xl overflow-hidden rounded-[1.75rem] border border-border bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] p-3 shadow-2xl shadow-black/35 backdrop-blur-sm md:p-5'>
              <div className='absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-primary/55 to-transparent' />

              <Carousel
                setApi={setApi}
                plugins={[autoplayPlugin]}
                slideCount={aboutImages.length}
                ssr={CAROUSEL_SSR.responsiveThirds(
                  aboutImages.length
                )}
                opts={{ loop: true, align: 'start' }}
                onMouseEnter={autoplayPlugin.stop}
                onMouseLeave={autoplayPlugin.reset}
                className='w-full'
              >
                <CarouselContent className='-ml-4'>
                  {aboutImages.map((image, index) => (
                    <CarouselItem
                      key={index}
                      className='md:basis-1/3 lg:basis-1/4'
                    >
                      <div className='group relative overflow-hidden rounded-[1.25rem] border border-border bg-background'>
                        <AspectRatio ratio={1 / 1}>
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className='object-cover transition-transform duration-1000 ease-out group-hover:scale-105'
                            sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                          />
                          <div className='absolute inset-0 bg-linear-to-t from-background/62 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
                        </AspectRatio>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <div className='hidden md:block'>
                  <CarouselPrevious className='left-8 border-border bg-background text-foreground backdrop-blur-md hover:border-primary hover:bg-primary hover:text-background' />
                  <CarouselNext className='right-8 border-border bg-background text-foreground backdrop-blur-md hover:border-primary hover:bg-primary hover:text-background' />
                </div>
              </Carousel>

              <div className='mt-8 flex items-center justify-center gap-2'>
                {api?.snapList().map((_, index) => (
                  <button
                    key={index}
                    onClick={() => api.goTo(index)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      current === index + 1 ?
                        'w-8 bg-primary'
                      : 'w-2 bg-foreground hover:bg-muted-foreground'
                    )}
                    aria-label={`Gå til bilde ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </article>
    </SectionBox>
  )
}
