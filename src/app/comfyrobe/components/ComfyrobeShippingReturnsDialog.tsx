'use client'

import Link from 'next/link'
import { PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

export function ComfyrobeShippingReturnsDialog({
  triggerClassName
}: {
  triggerClassName?: string
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type='button'
            data-track='ComfyrobePurchaseShippingReturns'
            className={triggerClassName}
          />
        }
      >
        <PackageCheck className='size-4' aria-hidden />
        Frakt og retur
      </DialogTrigger>

      <DialogContent className='inset-0 top-0 left-0 flex h-svh max-h-svh max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground ring-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:ring-1'>
        <DialogHeader className='shrink-0 border-b border-foreground/12 px-6 py-6 pr-14 sm:px-8 sm:py-7 sm:pr-14'>
          <p className='font-utekos-text-medium text-xs tracking-wide text-primary uppercase'>
            Comfyrobe™
          </p>
          <DialogTitle className='font-sans text-2xl font-bold tracking-tight sm:text-3xl'>
            Frakt og retur
          </DialogTitle>
          <DialogDescription className='max-w-xl font-utekos-text text-sm leading-6 text-foreground/72 sm:text-base'>
            Alt du trenger å vite om levering, bytte og retur.
          </DialogDescription>
        </DialogHeader>

        <div className='no-scrollbar min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7'>
          <section aria-labelledby='comfyrobe-shipping-heading'>
            <h2
              id='comfyrobe-shipping-heading'
              className='font-utekos-text-medium text-lg'
            >
              Fraktinformasjon
            </h2>
            <p className='mt-3 font-utekos-text text-sm leading-6 text-foreground/82 sm:text-base sm:leading-7'>
              Vi gjør vårt beste for å behandle og sende
              bestillinger innen samme virkedag (mandag–fredag
              før kl. 16, unntatt helligdager). Vi ber pent om at
              du velger standard frakt der det er mulig, for å
              redusere miljøpåvirkningen vår. Hvis du har
              spørsmål om bestillingen din, kan du ta kontakt med
              vår kundeservice, så hjelper vi deg gjerne.
            </p>
            <Link
              href='/frakt-og-retur'
              className='mt-4 inline-flex min-h-11 items-center font-utekos-text-medium text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
            >
              Mer informasjon
            </Link>
          </section>

          <section aria-labelledby='comfyrobe-returns-heading'>
            <h2
              id='comfyrobe-returns-heading'
              className='font-utekos-text-medium text-lg'
            >
              Retur og bytte
            </h2>
            <div className='mt-3 space-y-4 font-utekos-text text-sm leading-6 text-foreground/82 sm:text-base sm:leading-7'>
              <p>
                Er du usikker på størrelsen din? Klarer du ikke å
                velge? Vår kundeservice er her for å hjelpe – jo
                mindre unødvendig frakt, desto bedre.
              </p>
              <p>
                Vi designer produkter som er skapt for å prestere
                og bygget for å vare. Ta deg tid til å finne din
                nøyaktige størrelse. Mål to ganger, kjøp én gang
                og bruk plagget livet ut.
              </p>
              <p>
                Hvis du ikke er fornøyd med et av produktene våre
                når du mottar det, eller hvis et av produktene
                ikke lever opp til forventningene dine, gir vi
                deg muligheten til å returnere det og få en
                erstatning eller pengene tilbake.
              </p>
            </div>
            <Link
              href='/kontaktskjema'
              className='mt-4 inline-flex min-h-11 items-center font-utekos-text-medium text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
            >
              Kundeservice
            </Link>
          </section>
        </div>

        <DialogFooter className='shrink-0 border-t border-foreground/12 bg-background px-4 py-4 sm:px-8'>
          <DialogClose
            render={
              <Button
                type='button'
                className='min-h-12 w-full rounded-xl bg-primary font-utekos-text-medium text-foreground hover:bg-primary/90 sm:w-auto sm:min-w-32'
              />
            }
          >
            Tilbake
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
