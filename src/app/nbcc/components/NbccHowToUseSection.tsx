import { CheckIcon } from '@/components/animate-icons/icons/check'
import { MoveRightIcon } from '@/components/animate-icons/icons/move-right'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import type { Route } from 'next'

import { nbccSteps } from '../utils/nbccLandingPageContent'

export function NbccHowToUseSection() {
  return (
    <article
      id='slik-bruker-du-fordelen'
      className='bg-foreground-muted px-4 py-20 sm:px-6 lg:px-8'
    >
      <div className='mx-auto max-w-7xl'>
        <div className='grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start'>
          <div data-nbcc-reveal data-nbcc-animate>
            <p className='dark:text-dark-background font-utekos-text-medium text-sm tracking-[0.18em] text-background uppercase'>
              NBCC MEDLEMSFORDEL
            </p>
            <h2 className='dark:text-dark-background mt-4 max-w-xl font-utekos-text-medium text-3xl tracking-normal text-balance text-background sm:text-4xl'>
              Fra medlemskode til ekte Utekos.
            </h2>
            <p className='dark:text-dark-background mt-5 max-w-xl text-base text-background'>
              Som medlem får du en hyggelig prisrabatt på hele
              vårt hovedsortiment. Følg de tre enkle stegene for
              å hente koden din, eller hopp rett til kassen om du
              allerede har den klar.
            </p>
            <Button
              asChild
              className='dark:bg-dark-background hover:bg-foreground-muted mt-8 h-12 rounded-md bg-background px-6 text-foreground'
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
          </div>

          <div
            data-nbcc-reveal
            data-nbcc-animate
            className='rounded-lg border border-[#17130f]/10 bg-white/60 p-6 sm:p-8'
          >
            <ol className='grid gap-6'>
              {nbccSteps.map((step, index) => (
                <li
                  key={step.title}
                  className='grid gap-5 sm:grid-cols-[3rem_1fr]'
                >
                  <span className='flex size-12 items-center justify-center rounded-md bg-card text-white'>
                    <CheckIcon
                      size={22}
                      animate='default'
                      className='dark:text-dark-primary text-primary'
                      aria-hidden
                    />
                  </span>
                  <div>
                    <p className='dark:text-dark-background font-utekos-text-medium text-sm text-background'>
                      Steg {index + 1}
                    </p>
                    <h3 className='dark:text-dark-background mt-1 font-utekos-text-medium text-xl text-background'>
                      {step.title}
                    </h3>
                    <p className='dark:text-dark-background mt-2 text-sm leading-7 text-background'>
                      {step.description}
                    </p>
                  </div>
                  {index < nbccSteps.length - 1 && (
                    <Separator className='dark:bg-dark-background/50 bg-background/50 sm:col-start-2' />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </article>
  )
}
