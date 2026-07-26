'use client'

import {
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { AccordionContentRenderer } from './AccordionContentRenderer'
import type { AccordionSectionData } from '@types'

export function ProductDetailsAccordionSection({
  sectionData
}: {
  sectionData: AccordionSectionData
  currentVariantId?: string
}) {
  const { id, title, content, Icon, color } = sectionData

  return (
    <AccordionItem
      value={id}
      className='group border-coral-green dark:data-open:border-dark-card-foreground/24 dark:data-open:bg-dark-card/70 relative overflow-hidden rounded-xl border-b bg-card text-card-foreground transition-colors duration-200 hover:cursor-pointer data-open:border-card-foreground/24 data-open:bg-card/70'
      style={{ contain: 'layout style paint' }}
    >
      <div className='dark:bg-dark-background/0 dark:group-data-open:bg-dark-card-foreground/8 pointer-events-none absolute inset-0 z-0 bg-background/0 transition-colors duration-200 group-hover:cursor-pointer group-hover:bg-card-foreground/8 group-data-open:bg-card-foreground/8 dark:group-hover:bg-foreground/8' />

      <AccordionTrigger className='dark:focus-visible:ring-dark-card-foreground/45 dark:data-[state=open]:text-dark-card-foreground dark:svg]:text-dark-card-foreground/70 relative z-10 min-h-14 items-center px-5 py-4 text-card-foreground transition-colors duration-200 hover:text-card-foreground hover:no-underline focus-visible:ring-2 focus-visible:ring-card-foreground/45 data-[state=open]:text-card-foreground sm:px-6 [&>svg]:text-card-foreground/70'>
        <div className='flex items-center gap-4'>
          <div
            className='dark:border-dark-card-foreground/24 flex size-10 items-center justify-center rounded-full border border-card-foreground/24 bg-card text-card-foreground transition-transform duration-200 group-hover:scale-105'
            style={{ transform: 'translateZ(0)' }}
          >
            <Icon
              className='size-5 shrink-0 transition-colors duration-200'
              style={{ color }}
              aria-hidden='true'
            />
          </div>
          <span className='text-md font-utekos-text-medium leading-[1.2] tracking-[-0.01em]'>
            {title}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContentRenderer content={content} />
    </AccordionItem>
  )
}
