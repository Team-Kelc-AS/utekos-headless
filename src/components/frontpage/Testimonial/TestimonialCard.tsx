// Path: src/components/frontpage/TestimonialCard.tsx
'use client'

import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'
import { PremiumStarRating } from './PremiumStarRating'
import type { Testimonial } from './testimonials'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'
import { Quote } from 'lucide-react'

export function TestimonialCard({
  testimonial,
  index
}: {
  testimonial: Testimonial
  index: number
}) {
  const [cardRef, cardInView] = useInView({ threshold: 0.2 })
  const [lineRef, lineInView] = useInView({ threshold: 0.5 })
  const cardDelay = `${0.2 + (index % 3) * 0.15}s`
  const lineDelay = `${0.1 + (index % 3) * 0.1}s`

  return (
    <div
      ref={cardRef}
      className={cn(
        'will-animate-fade-in-up group relative flex h-full flex-col',
        cardInView && 'is-in-view'
      )}
      style={
        {
          '--transition-delay': cardDelay
        } as React.CSSProperties
      }
    >
      <div className='absolute -top-8 left-8 z-0 h-8 w-0.5 md:-top-12 md:left-10 md:h-12'>
        <div
          ref={lineRef}
          className={cn(
            'will-animate-scale-y size-full origin-top bg-card-foreground/25 transition-transform duration-700 ease-out',
            lineInView ? 'scale-y-100' : 'scale-y-0'
          )}
          style={
            {
              '--transition-delay': lineDelay
            } as React.CSSProperties
          }
        />
      </div>

      <div className='relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-5 text-foreground shadow-[0_12px_32px_-20px_color-mix(in_oklch,var(--card)_60%,transparent),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-md ring-1 ring-foreground/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl sm:p-6'>
        <div className='pointer-events-none absolute inset-0 bg-linear-to-br from-foreground/8 via-foreground/3 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

        <div className='relative z-10 flex h-full flex-col justify-between'>
          <div>
            <Quote
              aria-hidden='true'
              focusable='false'
              className='mb-3 size-4 text-foreground/30 sm:size-4.5'
            />
            <blockquote className='mb-4 sm:mb-5'>
              <P className='font-sans text-[15px] leading-relaxed font-medium text-foreground/90 not-first:mt-0 sm:text-base'>
                &ldquo;{testimonial.quote}&rdquo;
              </P>
            </blockquote>
          </div>

          <footer className='mt-auto flex items-center justify-between gap-3 border-t border-foreground/10 pt-3.5 sm:pt-4'>
            <InlineText className='font-sans text-sm font-semibold tracking-normal text-foreground'>
              {testimonial.name}
            </InlineText>

            <PremiumStarRating
              rating={testimonial.rating}
              cardIndex={index}
            />
          </footer>
        </div>
      </div>
    </div>
  )
}
