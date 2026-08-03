import { ChevronDown, ChevronUp } from 'lucide-react'
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
    <details
      data-accordion-id={id}
      data-accordion-title={title}
      className='group border-coral-green dark:open:border-dark-card-foreground/24 dark:open:bg-jungle relative overflow-hidden rounded-xl border-b bg-jungle text-card-foreground transition-colors duration-200 hover:cursor-pointer open:border-card-foreground/24 open:bg-jungle'
      style={{ contain: 'layout style paint' }}
    >
      <summary className='relative z-10 flex min-h-14 list-none items-center justify-between bg-jungle px-5 py-4 text-card-foreground transition-colors duration-200 hover:text-card-foreground focus-visible:ring-2 focus-visible:ring-card-foreground/45 focus-visible:outline-none group-open:text-card-foreground sm:px-6 [&::-webkit-details-marker]:hidden'>
        <span className='flex items-center gap-4'>
          <span
            className='dark:border-dark-card-foreground/24 flex size-10 items-center justify-center rounded-full border border-card-foreground/24 bg-card text-card-foreground transition-transform duration-200 group-hover:scale-105'
            style={{ transform: 'translateZ(0)' }}
          >
            <Icon
              className='size-5 shrink-0 transition-colors duration-200'
              style={{ color }}
              aria-hidden='true'
            />
          </span>
          <span className='text-md font-utekos-text-medium leading-[1.2] tracking-[-0.01em]'>
            {title}
          </span>
        </span>
        <ChevronDown
          className='size-4 shrink-0 text-card-foreground/70 group-open:hidden'
          aria-hidden='true'
        />
        <ChevronUp
          className='hidden size-4 shrink-0 text-card-foreground/70 group-open:block'
          aria-hidden='true'
        />
      </summary>
      <div className='dark:bg-dark-background/0 dark:group-open:bg-dark-card-foreground/8 pointer-events-none absolute inset-0 z-0 bg-background/0 transition-colors duration-200 group-hover:cursor-pointer group-hover:bg-card-foreground/8 group-open:bg-card-foreground/8 dark:group-hover:bg-foreground/8' />

      <AccordionContentRenderer content={content} />
    </details>
  )
}
