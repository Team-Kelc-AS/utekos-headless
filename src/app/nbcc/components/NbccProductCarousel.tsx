'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { NbccProductCarouselProps } from '../types'

export function NbccProductCarousel({
  images
}: NbccProductCarouselProps) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) return null

  if (images.length === 1) {
    const singleImage = images[0]
    if (!singleImage) return null
    return (
      <div className='relative aspect-square overflow-hidden bg-jungle'>
        <Image
          src={singleImage.src}
          alt={singleImage.alt}
          fill
          unoptimized
          sizes='(min-width: 1024px) 31vw, (min-width: 768px) 45vw, 100vw'
          data-nbcc-product-image
          className='rounded-lg object-contain p-7'
        />
      </div>
    )
  }

  const prev = () =>
    setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div className='group/carousel relative aspect-square overflow-hidden bg-jungle'>
      {images.map((img, i) => (
        <div
          key={img.src}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-300 ${
            i === current ? 'opacity-100' : (
              'pointer-events-none opacity-0'
            )
          }`}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            unoptimized
            sizes='(min-width: 1024px) 31vw, (min-width: 768px) 45vw, 100vw'
            data-nbcc-product-image
            className='rounded-lg object-contain p-7'
          />
        </div>
      ))}

      <button
        onClick={prev}
        aria-label='Forrige bilde'
        className='dark:bg-dark-foreground dark:text-dark-background dark:hover:bg-dark-foreground/90 absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-foreground p-1.5 text-background opacity-0 shadow-sm transition-opacity duration-200 group-hover/carousel:opacity-100 hover:bg-foreground/90'
      >
        <svg
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden
        >
          <path d='M15 18l-6-6 6-6' />
        </svg>
      </button>

      <button
        onClick={next}
        aria-label='Neste bilde'
        className='absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-black opacity-0 shadow-sm transition-opacity duration-200 group-hover/carousel:opacity-100 hover:bg-white'
      >
        <svg
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden
        >
          <path d='M9 18l6-6-6-6' />
        </svg>
      </button>

      <div className='absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2'>
        {images.map((_, i) => (
          <button
            key={i}
            type='button'
            onClick={() => setCurrent(i)}
            aria-label={`Bilde ${i + 1}`}
            className='group/dot flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white'
          >
            <span
              aria-hidden
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === current ?
                  'w-4 bg-white ring-1 ring-[#17130f]/45 dark:bg-[#17130f] dark:ring-white/55'
                : 'w-1.5 bg-white/70 ring-1 ring-[#17130f]/35 group-hover/dot:bg-white dark:bg-[#17130f]/70 dark:ring-white/45 dark:group-hover/dot:bg-[#17130f]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
