// Path: src/app/produkter/(oversikt)/components/ComfyrobeImageCarousel.tsx

'use client'

import comfyrobeMan1024x1024 from '@/assets/images/comfyrobe/comfy-mann-1024x1024.webp'
import ComfyRainy from '@/assets/images/comfyrobe/comfy_rainy.webp'
import Image from 'next/image'
import { useState } from 'react'
import Fade from 'embla-carousel-fade'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { AnimatedBlock } from '@/components/AnimatedBlock'

export function ComfyrobeImageCarousel() {
  const [fadePlugin] = useState(() => Fade())

  return (
    <AnimatedBlock className='will-animate-fade-in-left mx-auto flex w-full justify-center'>
      <Carousel
        plugins={[fadePlugin]}
        slideCount={2}
        opts={{ loop: true, align: 'center' }}
        className='relative mx-auto aspect-square w-full max-w-full overflow-hidden rounded-[1.35rem] bg-background/60 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--background)_90%,transparent)] dark:bg-dark-background/60'
      >
        <CarouselContent className='absolute inset-0 ml-0'>
          <CarouselItem className='absolute inset-0 basis-full pl-0'>
            <div className='relative flex size-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_28%,color-mix(in_oklch,var(--havdyp)_54%,var(--background)_46%)_0%,var(--background)_72%)]'>
              <Image
                src={comfyrobeMan1024x1024}
                alt='Mann med blå Comfyrobe utendørs.'
                fill
                quality={95}
                className='rounded-lg object-contain object-center p-0 transition-transform duration-500 motion-reduce:scale-100'
                sizes='(max-width: 1024px) 92vw, 40vw'
              />
            </div>
          </CarouselItem>

          <CarouselItem className='absolute inset-0 basis-full pl-0'>
            <div className='relative flex size-full items-center justify-center overflow-hidden bg-background dark:bg-dark-background'>
              <Image
                src={ComfyRainy}
                alt='Comfyrobe som tåler regnvær, vist i et norsk kystlandskap.'
                fill
                quality={95}
                className='object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100'
                sizes='(max-width: 1024px) 92vw, 40vw'
              />
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </AnimatedBlock>
  )
}
