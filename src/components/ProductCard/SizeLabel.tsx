// Path: src/components/ProductCard/SizeLabel.tsx
'use client'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'
import { cn } from '@/lib/utils/className'
import { ArrowUpRight, Ruler } from 'lucide-react'
import type { SizeLabelProps } from '@types'
import { H3 } from '@/components/typography/TypographyH3'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'

export function SizeLabel({
  className = '',
  label = 'STØRRELSE'
}: SizeLabelProps) {
  return (
    <HoverCard>
      <HoverCardTrigger
        href='/handlehjelp/storrelsesguide'
        target='_blank'
        rel='noopener noreferrer'
        style={{ outlineColor: 'var(--card-foreground)' }}
        className={cn(
          'inline-flex w-fit items-center gap-1 font-utekos-text-medium text-sm tracking-wide text-card-foreground uppercase hover:text-card-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground motion-safe:transition-colors',
          className
        )}
      >
        <InlineText>{label}</InlineText>
        <ArrowUpRight
          className='size-3.5 shrink-0 text-current'
          aria-hidden='true'
        />
        <span className='sr-only'>(åpnes i ny fane)</span>
      </HoverCardTrigger>
      <HoverCardContent
        className='w-60 border-border'
        side='top'
        align='start'
      >
        <div className='flex items-start space-x-3'>
          <Ruler className='mt-1 size-7 text-popover-foreground' />
          <div className='space-y-1'>
            <H3 className='pb-0 font-utekos-text-medium text-sm text-popover-foreground'>
              Usikker på størrelsen?
            </H3>
            <P className='text-sm text-popover-foreground/90 not-first:mt-0'>
              Klikk for å åpne vår størrelsesguide i en ny fane.
            </P>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
