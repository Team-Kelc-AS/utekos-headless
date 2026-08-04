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
import { MIKROFIBER_PURCHASE_GALLERY } from '../data/mikrofiberPurchaseGallery'

export function MicrofiberPurchaseImageCarousel() {
  const [fadePlugin] = useState(() => Fade())

  return (
    <Carousel
      plugins={[fadePlugin]}
      slideCount={MIKROFIBER_PURCHASE_GALLERY.length}
      opts={{ loop: true, align: 'center' }}
      aria-label='Utekos Mikrofiber produktbilder'
      className='relative size-full'
    >
      <CarouselContent className='absolute inset-0 ml-0 h-full'>
        {MIKROFIBER_PURCHASE_GALLERY.map((slide, index) => (
          <CarouselItem
            key={slide.id}
            className='absolute inset-0 basis-full pl-0'
          >
            <div className='relative size-full overflow-hidden bg-[#E5E2DB]'>
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                quality={95}
                sizes='(max-width: 768px) 100vw, 50vw'
                className='object-cover object-center'
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious
        forceVisible
        aria-label='Forrige produktbilde'
        className='left-3 size-10 border-[#2C2420]/15 bg-[#F4F1EA]/90 text-[#2C2420] shadow-lg backdrop-blur-md hover:bg-[#F4F1EA] md:left-4'
      />
      <CarouselNext
        forceVisible
        aria-label='Neste produktbilde'
        className='right-3 size-10 border-[#2C2420]/15 bg-[#F4F1EA]/90 text-[#2C2420] shadow-lg backdrop-blur-md hover:bg-[#F4F1EA] md:right-4'
      />
    </Carousel>
  )
}
