// Path: src/app/skreddersy-varmen/components/ReviewCard.tsx

import { Star, MapPin, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils/className'
import type { Review } from '../data/reviews'
import { initialsFrom } from '@/app/skreddersy-varmen/utils/initialsFrom'

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className={cn(
        // Grunnstil: Mørk maritim bakgrunn som skaper kontrast til "card" bakgrunnen.
        'group dark:border-dark-foreground/10 dark:bg-dark-background relative flex h-full flex-col justify-between rounded-lg border border-foreground/10 bg-background p-6 shadow-lg transition-all duration-400 md:p-7',
        'dark:hover:border-dark-primary/50 dark:hover:bg-dark-background/95 dark:hover:shadow-dark-primary/10 hover:-translate-y-1 hover:border-primary/50 hover:bg-background/95 hover:shadow-2xl hover:shadow-primary/10'
      )}
    >
      <header className='mb-5 flex items-center justify-between gap-3'>
        <div
          aria-hidden
          className='dark:text-dark-primary flex gap-0.5 text-primary drop-shadow-sm'
        >
          {Array.from({ length: Math.round(review.rating) }).map(
            (_, i) => (
              <Star
                key={i}
                fill='currentColor'
                size={14}
                strokeWidth={0}
              />
            )
          )}
        </div>
        {/* Verifisert-badge: Bruker accent for en beroligende, organisk og troverdig grønnfarge */}
        <span className='leading-text-paragraph dark:text-dark-primary inline-flex shrink-0 items-center gap-1 font-utekos-text-medium text-[10px] tracking-[-0.01em] text-primary'>
          <BadgeCheck size={12} aria-hidden />
          Verifisert
        </span>
      </header>

      {review.title && (
        <h3 className='mb-3 font-sans text-xl leading-[0.95] tracking-[-0.01em] text-foreground md:text-2xl'>
          &ldquo;{review.title}&rdquo;
        </h3>
      )}

      {/* foreground med litt transparens for behagelig lese-kontrast i brødteksten */}
      <p className='leading-text-paragraph /85 mb-6 text-sm tracking-[-0.01em] text-foreground/85 md:text-base'>
        {review.quote}
      </p>

      <footer className='dark:border-dark-foreground/10 flex items-center gap-3 border-t border-foreground/10 pt-4'>
        <div
          aria-hidden
          className='dark:border-dark-foreground/15 dark:bg-dark-foreground/5 dark:group-hover:border-dark-primary/40 dark:group-hover:bg-dark-primary/10 dark:group-hover:text-dark-foreground flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/15 bg-foreground/5 font-utekos-text-medium text-sm text-foreground transition-colors duration-400 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-foreground'
        >
          {initialsFrom(review.name)}
        </div>
        <div className='min-w-0'>
          <p className='leading-text-paragraph truncate font-utekos-text-medium text-sm tracking-[-0.01em] text-foreground'>
            {review.name}
          </p>
          {(review.role || review.location) && (
            <p className='leading-text-paragraph /50 flex items-center gap-1.5 text-xs tracking-[-0.01em] text-foreground/50'>
              {review.role && (
                <>
                  <span className='truncate'>{review.role}</span>
                  {review.location && <span aria-hidden>·</span>}
                </>
              )}
              {review.location && (
                <>
                  <MapPin size={10} aria-hidden />
                  <span className='truncate'>
                    {review.location}
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      </footer>
    </article>
  )
}
