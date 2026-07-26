'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { PRODUCT_CARE_FAQS } from '../constants'

export function ProductCareFaq() {
  return (
    <article
      aria-labelledby='faq-heading'
      className='mx-auto w-full text-left lg:max-w-7xl'
    >
      <div className='mb-8 text-left'>
        <h2
          id='faq-heading'
          className='font-google-sans text-left font-sans text-5xl leading-[0.95] font-bold text-foreground sm:text-5xl'
        >
          Vanlige spørsmål
        </h2>
        <p className='/90 mt-5 text-left font-utekos-text-medium text-lg leading-8 text-foreground/90'>
          Svar på det kundene våre oftest lurer på om vask og
          vedlikehold.
        </p>
      </div>

      <Accordion
        multiple={false}
        className='rounded-lg border-t border-border bg-background'
      >
        {PRODUCT_CARE_FAQS.map((faq, index) => (
          <AccordionItem
            key={faq.question}
            value={`faq-${index + 1}`}
            className='rounded-xl border-t border-border bg-background p-4'
          >
            <AccordionTrigger className='py-4 text-left font-sans font-utekos-text-medium text-base text-foreground hover:no-underline **:data-[slot=accordion-trigger-icon]:text-primary sm:py-5 sm:text-lg'>
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className='/90 pb-4 text-left font-utekos-text-medium text-base leading-relaxed text-foreground/90 sm:pb-5'>
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </article>
  )
}
