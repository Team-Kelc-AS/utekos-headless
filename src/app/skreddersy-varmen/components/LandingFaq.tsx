// Path: src/app/skreddersy-varmen/components/LandingFaq.tsx
import { cacheLife, cacheTag } from 'next/cache'
import { LANDING_FAQ_ENTRIES } from '../data/landingSeoContent'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  landingAccordionContentClassName,
  landingAccordionItemClassName,
  landingAccordionTriggerClassName
} from './landingAccordionStyles'

export async function LandingFaq() {
  'use cache'
  cacheLife('weeks')
  cacheTag('skreddersy-varmen', 'skreddersy-varmen-faq')

  return (
    <section
      aria-labelledby='landing-faq-heading'
      className='dark:bg-dark-background w-full bg-background px-6 py-16 text-foreground md:px-12 md:py-24'
    >
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16'>
        <div>
          <p className='text-foreground-muted mb-3 text-sm leading-4 font-medium'>
            Ofte stilte spørsmål
          </p>
          <h2
            id='landing-faq-heading'
            className='font-google-sans max-w-[12ch] font-sans text-4xl leading-[0.95] font-bold tracking-normal text-foreground md:text-5xl'
          >
            FAQ
          </h2>
        </div>

        <Accordion multiple={false} className='w-full gap-3'>
          {LANDING_FAQ_ENTRIES.map(entry => (
            <AccordionItem
              key={entry.question}
              value={entry.question}
              className={landingAccordionItemClassName}
            >
              <AccordionTrigger
                className={landingAccordionTriggerClassName}
              >
                {entry.question}
              </AccordionTrigger>
              <AccordionContent
                className={landingAccordionContentClassName}
              >
                <p className='leading-text-paragraph max-w-2xl text-base text-foreground/82'>
                  {entry.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
