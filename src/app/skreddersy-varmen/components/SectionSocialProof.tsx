// Path: src/app/skreddersy-varmen/components/SectionSocialProof.tsx
'use client'

import * as m from 'motion/react-m'
import { Star, StarHalf, Quote } from 'lucide-react'
import { reviews } from '../data/reviews'
import { ReviewCard } from '@/app/skreddersy-varmen/components/ReviewCard'
import { SkreddersyMotionProvider } from './SkreddersyMotionProvider'
import {
  revealGroup,
  revealItem,
  revealPop,
  skreddersyViewport
} from './skreddersyMotionVariants'

export function SectionSocialProof() {
  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) /
    reviews.length
  ).toFixed(1)

  return (
    <SkreddersyMotionProvider>
      <article
        aria-labelledby='socialproof-heading'
        className='dark:border-dark-background/20 relative w-full max-w-full overflow-hidden border-t border-background/20 bg-jungle py-20 text-foreground md:py-28'
      >
        <div
          aria-hidden
          className='pointer-events-none absolute -top-16 right-4 text-foreground opacity-[0.03] select-none md:right-16'
        >
          <Quote size={320} strokeWidth={1} />
        </div>

        <div className='relative z-10 mx-auto max-w-6xl px-6'>
          <m.header
            className='mb-12 text-center md:mb-16'
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealGroup}
          >
            <m.div
              className='leading-text-paragraph dark:border-dark-foreground/15 dark:bg-dark-foreground/5 /90 mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3.5 py-1.5 text-xs font-medium tracking-[-0.01em] text-foreground/90 backdrop-blur-sm'
              variants={revealPop}
            >
              <span
                aria-hidden
                className='flex gap-0.5 text-yellow-300 drop-shadow-sm'
              >
                {[1, 2, 3, 4].map(i => (
                  <Star
                    key={i}
                    fill='currentColor'
                    size={10}
                    strokeWidth={0}
                  />
                ))}
                <StarHalf
                  key='half'
                  fill='currentColor'
                  size={10}
                  strokeWidth={0}
                />
              </span>
              <span className='font-utekos-text-medium text-foreground'>
                {averageRating}
              </span>
            </m.div>

            <m.h2
              id='socialproof-heading'
              className='mx-auto max-w-[18ch] font-sans font-utekos-text-medium text-[clamp(1.75rem,7vw,3.75rem)] leading-[0.95] tracking-[-0.01em] text-balance wrap-break-word text-foreground sm:max-w-[22ch] md:max-w-5xl'
              variants={revealItem}
            >
              Livsnytere som tok kvelden tilbake
            </m.h2>

            <m.p
              className='leading-text-paragraph /80 mx-auto mt-5 max-w-[34ch] text-[clamp(0.875rem,3.4vw,1.125rem)] tracking-[-0.01em] text-balance wrap-break-word text-foreground/80 md:max-w-2xl'
              variants={revealItem}
            >
              Ord fra dem som allerede har byttet den snikende
              trekken mot en lun kokong.
            </m.p>
          </m.header>
        </div>

        <m.div
          data-utekos-marquee-region
          className='relative w-full max-w-full overflow-hidden py-4'
          role='region'
          aria-label='Kundeanmeldelser'
          tabIndex={0}
          initial='hidden'
          whileInView='visible'
          viewport={skreddersyViewport}
          variants={revealItem}
        >
          <div
            aria-hidden
            className='dark:from-dark-card pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-card to-transparent md:w-24'
          />
          <div
            aria-hidden
            className='dark:from-dark-card pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-card to-transparent md:w-24'
          />

          <div
            data-utekos-marquee
            className='flex w-max will-change-transform'
          >
            {[...reviews, ...reviews].map((review, i) => (
              <div
                key={`${review.id}-${i}`}
                aria-hidden={i >= reviews.length}
                className='mr-4 w-[min(85vw,22rem)] shrink-0 md:mr-6 md:w-88 lg:w-[24rem]'
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </m.div>
      </article>
    </SkreddersyMotionProvider>
  )
}
