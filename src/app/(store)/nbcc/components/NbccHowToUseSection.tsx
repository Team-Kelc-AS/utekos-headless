import { CheckIcon } from '@/components/animate-icons/icons/check'
import { MoveRightIcon } from '@/components/animate-icons/icons/move-right'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import type { Route } from 'next'

import { nbccSteps } from '../utils/nbccLandingPageContent'
import { NbccReveal } from './NbccReveal'

export function NbccHowToUseSection() {
  return (
    <article
      id='slik-bruker-du-fordelen'
      className='bg-jungle px-4 py-20 text-foreground sm:px-6 lg:px-8'
    >
      <div className='mx-auto max-w-7xl'>
        <div className='grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start'>
          <NbccReveal>
            <p className='font-utekos-text-medium text-sm tracking-[0.18em] text-foreground uppercase'>
              NBCC MEDLEMSFORDEL
            </p>
            <h2 className='mt-4 max-w-xl font-utekos-text-medium text-3xl tracking-normal text-balance text-foreground sm:text-4xl'>
              Fra medlemskode til ekte Utekos.
            </h2>
            <p className='mt-5 max-w-xl font-utekos-text text-base text-foreground'>
              Som medlem får du en hyggelig prisrabatt på hele
              vårt hovedsortiment. Følg de tre enkle stegene for
              å hente koden din, eller hopp rett til kassen om du
              allerede har den klar.
            </p>
            <Button
              asChild
              className='hover:bg-primary-muted mt-8 h-12 rounded-xl bg-primary px-6 font-utekos-text-medium text-foreground'
            >
              <Link
                href={'/produkter' as Route}
                data-track='NbccHowToProductsClick'
                data-track-data={JSON.stringify({
                  page: 'nbcc',
                  section: 'how-to-use',
                  target: 'products'
                })}
              >
                Velg produkter
                <MoveRightIcon
                  size={18}
                  animateOnHover='default'
                />
              </Link>
            </Button>
          </NbccReveal>

          <NbccReveal className='rounded-lg border border-foreground/15 bg-card p-6 sm:p-8'>
            <ol className='grid gap-6'>
              {nbccSteps.map((step, index) => (
                <li
                  key={step.title}
                  className='grid gap-5 sm:grid-cols-[3rem_1fr]'
                >
                  <span className='flex size-12 items-center justify-center rounded-md bg-background text-foreground'>
                    <CheckIcon
                      size={22}
                      animate='default'
                      className='text-primary'
                      aria-hidden
                    />
                  </span>
                  <div>
                    <p className='font-utekos-text-medium text-sm text-foreground'>
                      Steg {index + 1}
                    </p>
                    <h3 className='mt-1 font-utekos-text-medium text-xl text-foreground'>
                      {step.title}
                    </h3>
                    <p className='mt-2 text-sm leading-7 text-foreground'>
                      {step.description}
                    </p>
                  </div>
                  {index < nbccSteps.length - 1 && (
                    <Separator className='bg-foreground/20 sm:col-start-2' />
                  )}
                </li>
              ))}
            </ol>
          </NbccReveal>
        </div>
      </div>
    </article>
  )
}
