import { KlarnaLogo } from '@/components/payments/KlarnaLogo'
import { VippsLogo } from '@/components/payments/VippsLogo'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { AboutBadge } from './AboutBadge'
import type { Route } from 'next'

const reassuranceItems = [
  'Skapt for norske forhold',
  'Fri frakt over 999,-'
]

export function AboutCta() {
  return (
    <article className='bg-background py-20 text-foreground sm:py-28'>
      <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
        <div className='rounded-3xl border border-border bg-card p-8 text-center text-card-foreground sm:p-12'>
          <AboutBadge className='mb-6'>
            Oppdag vår kolleksjon
          </AboutBadge>
          <h2 className='font-utekos-text-medium text-4xl leading-tight text-inherit sm:text-5xl'>
            Klar til å skreddersy varmen?
          </h2>
          <p className='mx-auto mt-5 max-w-2xl text-lg leading-8 text-inherit/80'>
            Opplev hvordan gjennomtenkt funksjon og tidløs
            komfort kan forvandle en kjølig kveld til ditt
            favorittøyeblikk.
          </p>

          <Link
            href={'/produkter' as Route}
            data-track='AboutUsShopAllProductsClick'
            className='hover:bg-primary-hover mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-3xl bg-primary px-8 py-4 font-utekos-text-medium text-base text-primary-foreground transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-ring'
          >
            Se alle produkter
            <ArrowRight
              aria-hidden='true'
              className='size-5 text-current'
            />
          </Link>

          <div className='mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-sm text-inherit/90'>
            {reassuranceItems.map(item => (
              <span
                key={item}
                className='inline-flex items-center gap-2'
              >
                <Check
                  aria-hidden='true'
                  className='size-4 text-current'
                />
                <span>{item}</span>
              </span>
            ))}
            <span className='inline-flex items-center gap-3'>
              <span>Trygg handel med</span>
              <VippsLogo
                aria-label='Vipps'
                className='h-4 w-auto'
              />
              <KlarnaLogo
                aria-label='Klarna'
                className='h-4 w-auto'
              />
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
