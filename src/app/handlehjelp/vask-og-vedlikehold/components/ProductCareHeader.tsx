import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

export function ProductCareHeader() {
  return (
    <header className='max-w-3xl'>
      <nav aria-label='Brødsmulesti' className='mb-8'>
        <ol className='flex flex-wrap items-center gap-1.5 text-sm text-foreground'>
          <li>
            <Link
              href='/'
              className='dark:hover:text-dark-primary underline-offset-4 transition-colors hover:text-primary hover:underline'
            >
              Forsiden
            </Link>
          </li>
          <li aria-hidden='true'>
            <ChevronRight className='size-4' />
          </li>
          <li>
            <Link
              href='/handlehjelp/vask-og-vedlikehold'
              className='dark:hover:text-dark-primary underline-offset-4 transition-colors hover:text-primary hover:underline'
            >
              Handlehjelp
            </Link>
          </li>
          <li aria-hidden='true'>
            <ChevronRight className='size-4' />
          </li>
          <li aria-current='page' className='text-foreground'>
            Vask og vedlikehold
          </li>
        </ol>
      </nav>

      <hgroup>
        <BrandBadge
          label='Handlehjelp'
          backgroundColor='var(--background)'
          textColor='var(--foreground)'
          className='dark:border-dark-foreground/12 mb-4 border border-foreground/12 px-5 py-2.5 font-sans text-base tracking-wide text-foreground sm:px-8 sm:py-3'
        />
        <h1 className='font-google-sans py-4 text-3xl leading-[1.05] font-bold text-foreground md:text-5xl lg:text-6xl'>
          Produktvedlikehold
        </h1>
        <p className='/90 mt-5 max-w-2xl font-utekos-text text-lg leading-relaxed text-foreground/90'>
          Du har investert i komfort og kvalitet som er ment å
          vare, men ingen plagg opprettholder ytelsen over tid
          uten vedlikehold.
        </p>
      </hgroup>
    </header>
  )
}
