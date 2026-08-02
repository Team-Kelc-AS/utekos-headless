import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'

import { nbccFaqItems } from '../utils/nbccLandingPageContent'

export function NbccFaqSection() {
  return (
    <article className='dark:bg-dark-background bg-background px-4 py-20 sm:px-6 lg:px-8'>
      <div className='mx-auto grid w-full max-w-4xl gap-10'>
        <div data-nbcc-reveal data-nbcc-animate>
          <p className='mx-auto font-utekos-text-medium text-sm tracking-[0.18em] text-foreground uppercase md:text-2xl'>
            Spørsmål og svar
          </p>
        </div>

        <Accordion
          data-nbcc-reveal
          data-nbcc-animate
          className='rounded-lg border border-border bg-jungle px-5 text-card-foreground'
        >
          {nbccFaqItems.map(item => (
            <AccordionItem
              key={item.question}
              value={item.question}
            >
              <AccordionTrigger className='dark:hover:text-dark-primary py-5 text-base text-card-foreground hover:text-primary hover:no-underline'>
                {item.question}
              </AccordionTrigger>
              <AccordionContent className='/80 pb-6 text-sm leading-7 text-card-foreground/80'>
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </article>
  )
}
