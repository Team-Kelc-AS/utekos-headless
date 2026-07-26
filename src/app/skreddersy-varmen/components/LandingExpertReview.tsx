// Path: src/app/skreddersy-varmen/components/LandingExpertReview.tsx
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import {
  LANDING_AUTHOR_NAME,
  LANDING_EVIDENCE_ENTRIES,
  LANDING_LAST_UPDATED
} from '../data/landingSeoContent'

export async function LandingExpertReview() {
  'use cache'
  cacheLife('weeks')
  cacheTag(
    'skreddersy-varmen',
    'skreddersy-varmen-expert-review'
  )

  return (
    <article
      aria-labelledby='expert-review-heading'
      className='dark:bg-dark-foreground dark:text-dark-background w-full bg-foreground px-6 py-16 text-background md:px-12 md:py-24'
    >
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16'>
        <div>
          <p className='dark:text-dark-background mb-3 text-sm leading-4 font-medium text-background'>
            Faglig vurdert av {LANDING_AUTHOR_NAME}
          </p>
          <h2
            id='expert-review-heading'
            className='font-google-sans dark:text-dark-background max-w-[12ch] font-sans text-4xl leading-[0.95] font-bold tracking-normal text-background md:text-5xl'
          >
            Derfor holder Utekos deg ute lenger
          </h2>
          <p className='leading-text-paragraph dark:text-dark-background/82 mt-5 max-w-xl text-base text-background/82 md:text-lg'>
            Sist oppdatert {LANDING_LAST_UPDATED}. Denne siden
            bygger på produktdata, kundeerfaringer,
            materialinformasjon og Utekos sine egne kjøpsguider.
          </p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          {LANDING_EVIDENCE_ENTRIES.map(entry => (
            <article
              key={entry.title}
              className='dark:border-dark-background/12 bg-foreground-muted rounded-sm border border-background/12 p-5 shadow-sm'
            >
              <h3 className='font-google-sans dark:text-dark-background font-sans text-xl leading-[0.98] font-bold tracking-normal text-background'>
                {entry.title}
              </h3>
              <p className='leading-text-paragraph dark:text-dark-background/82 mt-3 text-sm text-background/82'>
                {entry.answer}
              </p>
              <Link
                href={entry.href}
                className='dark:text-dark-background dark:hover:text-dark-card mt-4 inline-flex font-utekos-text-medium text-sm text-background underline underline-offset-4 transition-colors hover:text-card'
              >
                {entry.linkLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </article>
  )
}
