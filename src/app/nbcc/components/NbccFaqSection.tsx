import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'

import { nbccFaqItems } from '../utils/nbccLandingPageContent'
import { NbccReveal } from './NbccReveal'

export function NbccFaqSection() {
  return (
    <article className='bg-background px-4 py-20 sm:px-6 lg:px-8'>
      <div className='mx-auto grid w-full max-w-4xl gap-10'>
        <NbccReveal>
          <p className='mx-auto font-utekos-text-medium text-sm tracking-[0.18em] text-foreground uppercase md:text-2xl'>
            Spørsmål og svar
          </p>
        </NbccReveal>

        <NbccReveal>
          <Accordion
            data-nbcc-faq-surface
            className='rounded-lg border border-border bg-jungle px-5 text-foreground'
          >
            {nbccFaqItems.map(item => (
              <AccordionItem
                key={item.question}
                value={item.question}
              >
                <AccordionTrigger className='py-5 text-base text-foreground hover:text-primary hover:no-underline'>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className='pb-6 text-sm leading-7 text-foreground/85'>
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </NbccReveal>
      </div>
    </article>
  )
}
