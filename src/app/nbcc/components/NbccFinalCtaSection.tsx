import { MoveRightIcon } from '@/components/animate-icons/icons/move-right'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Route } from 'next'

import { nbccFinalCtaTracking } from '../utils/nbccLandingPageContent'

export function NbccFinalCtaSection() {
  return (
    <article className='relative overflow-hidden bg-muted px-4 py-20 text-foreground sm:px-6 lg:px-8'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,195,106,0.18),transparent_34%),radial-gradient(circle_at_82%_42%,rgba(199,230,201,0.12),transparent_32%)]' />
      <div
        data-nbcc-reveal
        data-nbcc-animate
        className='relative mx-auto flex max-w-4xl flex-col items-center text-center'
      >
        <p className='font-utekos-text-medium text-sm tracking-[0.18em] text-foreground uppercase'>
          Klar for neste campingtur
        </p>
        <h2 className='mt-4 max-w-3xl font-sans text-4xl text-balance text-foreground sm:text-5xl'>
          Ta med varmen til plassen der praten fortsetter
        </h2>
        <p className='mt-6 max-w-2xl text-base text-foreground'>
          Opplev en ny standard for utendørs velvære. Utekos
          forener banebrytende innovasjon med tidløs eleganse.
          Kjernen i konseptet er vår unike 3-i-1 funksjonalitet.
          Gjennomtestede løsninger lar deg enkelt tilpasse
          passform, regulere ventilasjon og veksle mellom ulike
          funksjonelle moduser. Når dine behov for velvære endrer
          seg, finnes det alltid en justeringsmulighet som lar
          deg fortsette opplevelsen av kompromissløs komfort.
          Helt uavbrutt. Du har en mobil varmekilde som endrer
          måten du behøver å planlegge på.
        </p>
        <Button
          asChild
          data-track='NbccFinalProductsClick'
          data-track-data={JSON.stringify(nbccFinalCtaTracking)}
          size='lg'
          className='mt-9 h-12 rounded-md bg-primary px-6 font-utekos-text-medium text-[15px] text-primary-foreground hover:bg-primary/90'
        >
          <Link
            href={'/produkter' as Route}
            data-track='NbccFinalProductsClick'
            data-track-data={JSON.stringify(
              nbccFinalCtaTracking
            )}
          >
            Gå til produktene
            <MoveRightIcon size={18} animateOnHover='default' />
          </Link>
        </Button>
      </div>
    </article>
  )
}
