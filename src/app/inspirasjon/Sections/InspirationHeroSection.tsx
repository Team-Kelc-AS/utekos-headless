import Link from 'next/link'
import { inspirationPages } from '../layout/inspirationPages'

export function InspirationHeroSection() {
  return (
    <article className='inspirasjon-route w-full py-16'>
      <div className='container mx-auto w-full px-4'>
        <div className='mb-12 w-full text-center'>
          <h2 className='font-google-sans mx-auto mb-4 w-full max-w-3xl text-4xl leading-tight font-bold text-balance wrap-break-word text-foreground'>
            Mer inspirasjon for dine øyeblikk
          </h2>
          <p className='utekos-section-lead mx-auto max-w-2xl text-foreground'>
            Finn ideer til situasjoner der komfort møter norsk
            natur. Se hvordan små grep gjør uteøyeblikkene
            varmere.
          </p>
        </div>
        <div className='mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-4'>
          {inspirationPages.map(page => (
            <Link
              key={page.href}
              href={page.href}
              className='group block w-full max-w-72 sm:w-[calc(50%-0.5rem)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]'
            >
              <div className='dark:border-dark-foreground/18 dark:hover:border-dark-foreground/28 relative h-full overflow-hidden rounded-lg border border-foreground/18 bg-card p-6 text-center text-foreground shadow-[0_18px_46px_-34px_color-mix(in_oklch,var(--background)_55%,transparent)] transition-all hover:-translate-y-1 hover:border-foreground/28 hover:shadow-[0_24px_58px_-38px_color-mix(in_oklch,var(--background)_70%,transparent)]'>
                <div className='mb-4 flex flex-col items-center justify-center gap-3'>
                  <div className='bg-card-harmony-left flex size-10 shrink-0 items-center justify-center rounded-lg'>
                    <page.icon
                      className='dark:text-dark-primary size-5 text-primary'
                      aria-hidden
                    />
                  </div>
                  <h3 className='font-google-sans text-center leading-[0.95] font-bold tracking-[-0.01em] text-foreground'>
                    {page.label}
                  </h3>
                </div>
                <p className='leading-text-paragraph text-center text-sm tracking-[-0.01em] text-foreground'>
                  {page.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </article>
  )
}
