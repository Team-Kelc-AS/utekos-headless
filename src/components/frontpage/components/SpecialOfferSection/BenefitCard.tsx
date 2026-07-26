// Path: src/components/frontpage/components/SpecialOfferSection/BenefitCard.tsx
'use client'

import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { cn } from '@/lib/utils/className'

type BenefitTone = 'water' | 'mauve' | 'overcast'

interface Benefit {
  label: string
  description: string
  tone: BenefitTone
}

interface BenefitCardProps {
  benefit: Benefit
  delay: number
}

const toneStyles: Record<BenefitTone, { icon: string }> = {
  water: {
    icon: 'border-card-foreground/28 bg-secondary text-sidebar-foreground'
  },
  mauve: {
    icon: 'border-card-foreground/28 bg-secondary text-sidebar-foreground'
  },
  overcast: {
    icon: 'border-card-foreground/28 bg-secondary text-sidebar-foreground'
  }
}

export function BenefitCard({
  benefit,
  delay
}: BenefitCardProps) {
  const styles = toneStyles[benefit.tone]

  return (
    <li
      className={cn(
        'animate-fade-in-on-scroll group font-sans-normal dark:border-dark-border relative overflow-hidden rounded-lg border border-border bg-background p-3 text-foreground shadow-sm transition-all duration-300 hover:translate-x-1 xl:p-4'
      )}
      style={
        { '--animation-delay': `${delay}s` } as CSSProperties
      }
    >
      <div className='relative z-10 flex min-w-0 items-center gap-3'>
        {/*
          Chip pairs invert the featured surface: light and dark mode
          both exceed 10.9:1 for text and 3:1 for the chip boundary.
        */}
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-md border transition-all duration-300 group-hover:scale-110',
            styles.icon
          )}
        >
          <Check className='size-5' />
        </div>
        <div className='min-w-0 flex-1 text-sm'>
          <InlineText
            as='strong'
            className='font-utekos-text-medium text-foreground'
          >
            {benefit.label}
          </InlineText>
          {benefit.description && (
            <InlineText className='text-foreground/82'>
              {' '}
              {benefit.description}
            </InlineText>
          )}
        </div>
      </div>
    </li>
  )
}
