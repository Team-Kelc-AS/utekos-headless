// Path: src/app/skreddersy-varmen/components/LandingFaq.tsx
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import type { Route } from 'next'
import { LANDING_FAQ_ENTRIES } from '../data/landingSeoContent'

export async function LandingFaq() {
  'use cache'
  cacheLife('weeks')
  cacheTag('skreddersy-varmen', 'skreddersy-varmen-faq')

  return (
    <article
      aria-labelledby='landing-faq-heading'
      className='dark:bg-dark-background w-full bg-background px-6 py-16 text-foreground md:px-12 md:py-24'
    >
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16'>
        <div>
          <p className='text-foreground-muted mb-3 text-sm leading-4 font-medium'>
            Ofte spurt
          </p>
          <h2
            id='landing-faq-heading'
            className='font-google-sans max-w-[12ch] font-sans text-4xl leading-[0.95] font-bold tracking-normal text-foreground md:text-5xl'
          >
            FAQ
          </h2>
          <Link
            href={'/handlehjelp/sammenlign-modeller' as Route}
            className='dark:hover:text-dark-primary mt-6 inline-flex font-utekos-text-medium text-sm text-foreground underline underline-offset-4 transition-colors hover:text-primary'
          >
            Sammenlign modellene
          </Link>
        </div>

        <div className='dark:divide-dark-foreground/14 dark:border-dark-foreground/14 divide-y divide-foreground/14 border-y border-foreground/14'>
          {LANDING_FAQ_ENTRIES.map(entry => (
            <details key={entry.question} className='group py-5'>
              <summary className='dark:hover:text-dark-primary dark:focus-visible:text-dark-primary dark:focus-visible:outline-dark-primary cursor-pointer list-none font-sans font-utekos-text-medium text-lg leading-[1.1] tracking-normal text-foreground transition-colors outline-none marker:hidden hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:text-xl'>
                <span className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4'>
                  <span>{entry.question}</span>
                  <span
                    aria-hidden
                    className='dark:text-dark-primary text-2xl leading-none text-primary transition-transform group-open:rotate-45'
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className='leading-text-paragraph /82 mt-4 max-w-2xl text-base text-foreground/82'>
                {entry.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </article>
  )
}
