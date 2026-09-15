// Path: src/app/skreddersy-varmen/components/LandingFaq.tsx
import { LANDING_FAQ_ENTRIES } from '../data/landingSeoContent'
import {
  landingAccordionContentClassName,
  landingAccordionItemClassName,
  landingAccordionTriggerClassName
} from './landingAccordionStyles'

export function LandingFaq() {
  return (
    <section
      data-journey-section='faq'
      aria-labelledby='landing-faq-heading'
      className='w-full bg-night px-6 py-16 text-foreground md:px-12 md:py-24'
    >
      <div className='mx-auto flex w-full max-w-5xl flex-col items-start gap-10'>
        <div>
          <p className='text-foreground-muted mb-3 text-sm leading-4 font-medium'>
            Ofte stilte spørsmål
          </p>
          <h2
            id='landing-faq-heading'
            className='max-w-[12ch] font-google-sans font-sans text-4xl leading-[0.95] font-bold tracking-normal text-foreground md:text-5xl'
          >
            FAQ
          </h2>
        </div>

        <div className='w-full max-w-4xl gap-3'>
          {LANDING_FAQ_ENTRIES.map(entry => (
            <details
              name='landing-faq'
              key={entry.question}
              className={landingAccordionItemClassName}
            >
              <summary
                className={landingAccordionTriggerClassName}
              >
                {entry.question}
              </summary>
              <div className={landingAccordionContentClassName}>
                <p className='leading-text-paragraph max-w-2xl text-base text-foreground/82'>
                  {entry.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
