// Path: src/components/frontpage/TestimonialCard.tsx
'use client'

import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'
import { PremiumStarRating } from './PremiumStarRating'
import type { Testimonial } from './testimonials'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'

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
        'will-animate-fade-in-up group relative flex h-full min-h-[22rem] flex-col',
        cardInView && 'is-in-view'
      )}
      style={
        {
          '--transition-delay': cardDelay
        } as React.CSSProperties
      }
    >
      <div className='absolute -top-12 left-8 z-0 h-12 w-0.5 md:left-10'>
        <div
          ref={lineRef}
          className={cn(
            'will-animate-scale-y -foreground/25 size-full origin-top bg-card-foreground/25 transition-transform duration-700 ease-out',
            lineInView ? 'scale-y-100' : 'scale-y-0'
          )}
          style={
            {
              '--transition-delay': lineDelay
            } as React.CSSProperties
          }
        />
      </div>

      <div className='relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-8 text-foreground shadow-[0_18px_48px_-34px_color-mix(in_oklch,var(--card)_70%,transparent)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-2xl'>
        <div className='pointer-events-none absolute inset-0 bg-linear-to-br from-foreground/10 via-foreground/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

        <div className='relative z-10 flex h-full flex-col'>
          <blockquote className='mb-8 grow'>
            <P className='text-base leading-relaxed font-medium text-foreground italic not-first:mt-0 md:text-lg'>
              &quot;{testimonial.quote}&quot;
            </P>
          </blockquote>

          <footer className='mt-auto flex items-center justify-between border-t border-foreground/25 pt-6'>
            <div className='flex flex-col gap-2'>
              <InlineText className='font-google-sans text-sm font-bold tracking-wide text-foreground'>
                {testimonial.name}
              </InlineText>

              <PremiumStarRating
                rating={testimonial.rating}
                cardIndex={index}
              />
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
