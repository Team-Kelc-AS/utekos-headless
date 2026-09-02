// Path: src/app/skreddersy-varmen/components/SectionSocialProof.tsx
'use client'

import * as m from 'motion/react-m'
import { Star, StarHalf } from 'lucide-react'
import {
  techDownReviews,
  techDownReviewSummary
} from '../data/reviews'
import { ReviewCard } from '@/app/skreddersy-varmen/components/ReviewCard'
import { SkreddersyMotionProvider } from './SkreddersyMotionProvider'
import { cn } from '@/lib/utils/className'
import styles from './SectionSocialProof.module.css'
import {
  revealGroup,
  revealItem,
  revealPop,
  skreddersyViewport
} from './skreddersyMotionVariants'

export function SectionSocialProof() {
  const averageRating =
    techDownReviewSummary.ratingValue.toFixed(1)

  return (
    <SkreddersyMotionProvider>
      <section
        id='reviews-section'
        aria-labelledby='socialproof-heading'
        className='dark:border-dark-background/20 relative w-full max-w-full scroll-mt-17.5 overflow-hidden border-t border-background/20 bg-jungle py-20 text-foreground md:py-28 xl:scroll-mt-21.5'
      >
        <div className='relative z-10 mx-auto max-w-6xl px-6'>
          <m.header
            className='mb-12 text-center md:mb-16'
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealGroup}
          >
            <m.div
              className='leading-text-paragraph dark:border-dark-foreground/15 dark:bg-dark-foreground/5 mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3.5 py-1.5 text-xs font-medium tracking-[-0.01em] text-foreground/90 backdrop-blur-sm'
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
              className='mx-auto max-w-[18ch] font-sans text-[clamp(1.75rem,7vw,3.75rem)] leading-[0.95] font-bold tracking-[-0.01em] text-balance wrap-break-word text-foreground sm:max-w-[22ch] md:max-w-5xl'
              variants={revealItem}
            >
              Hva sier andre livsnytere?
            </m.h2>

            <m.p
              className='leading-text-paragraph mx-auto mt-5 max-w-[34ch] text-center text-[clamp(0.875rem,3.4vw,1.125rem)] tracking-[-0.01em] text-balance wrap-break-word text-foreground/80 md:max-w-2xl'
              variants={revealItem}
            >
              Tilbakemeldinger fra mennesker som valgte å
              investere i forbedret og forlenget hygge utendørs.
            </m.p>
          </m.header>
        </div>

        <m.div
          className={cn(
            styles.region,
            'relative w-full max-w-full overflow-hidden py-4'
          )}
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

          <div className={cn(styles.track, 'flex w-max')}>
            {techDownReviews.map(review => (
              <div
                key={review.id}
                className='mr-4 w-[min(85vw,22rem)] shrink-0 md:mr-6 md:w-88 lg:w-[24rem]'
              >
                <ReviewCard review={review} />
              </div>
            ))}
            {techDownReviews.map(review => (
              <div
                key={`marquee-${review.id}`}
                aria-hidden
                className='mr-4 w-[min(85vw,22rem)] shrink-0 md:mr-6 md:w-88 lg:w-[24rem]'
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </m.div>
      </section>
    </SkreddersyMotionProvider>
  )
}
