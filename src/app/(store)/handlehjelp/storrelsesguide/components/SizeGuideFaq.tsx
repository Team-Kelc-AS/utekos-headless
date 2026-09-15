'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { techDownFaq } from '../utils/techDownFaq'
import { SizeGuideFaqAnswer } from './SizeGuideFaqAnswer'

export function SizeGuideFaq() {
  return (
    <div className='rounded-[1.75rem] border border-foreground/12 bg-background mb-8 p-1.5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_14%,transparent)]'>
      <Accordion
        multiple={false}
        className='overflow-hidden rounded-[1.25rem] bg-jungle'
      >
        {techDownFaq.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`faq-${index + 1}`}
            className='border-foreground/10 px-5 not-last:border-b sm:px-7'
          >
            <AccordionTrigger className='min-h-17 py-5 text-left font-sans text-lg leading-snug text-foreground transition-[color,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:no-underline focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.995] **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-primary sm:text-xl'>
              {item.question}
            </AccordionTrigger>
            <AccordionContent className='pb-6 font-utekos-text text-base leading-relaxed text-foreground sm:text-lg'>
              <SizeGuideFaqAnswer answer={item.answer} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
