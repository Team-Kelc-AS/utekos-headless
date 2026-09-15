import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { normalizeCustomerReturnTo } from '@/lib/shopify/customer-account/customerAccountAuth'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  LockKeyhole
} from 'lucide-react'
import type { Metadata } from 'next'
import type { Route } from 'next'
import Link from 'next/link'
import { z } from 'zod'

export const metadata: Metadata = {
  title: 'Logg inn',
  description:
    'Logg inn eller opprett en Utekos-konto via Shopify.'
}

const loginPageQuerySchema = z.object({
  mode: z.enum(['login', 'create']).catch('login'),
  returnTo: z.string().optional(),
  error: z.string().optional()
})

const errorMessages: Record<string, string> = {
  invalid_input: 'Kontroller e-postadressen og prøv igjen.',
  cancelled:
    'Innloggingen ble avbrutt. Du kan prøve igjen når du er klar.',
  invalid_callback:
    'Vi kunne ikke fullføre innloggingen. Prøv igjen.',
  invalid_state:
    'Innloggingsforsøket utløp. Start på nytt for å fortsette.',
  shopify_unavailable:
    'Shopify-innlogging er midlertidig utilgjengelig. Prøv igjen litt senere.',
  shopify_auth_failed:
    'Shopify kunne ikke fullføre innloggingen. Prøv igjen.'
}

export default async function CustomerAccountLoginPage({
  searchParams
}: {
  searchParams: Promise<{
    mode?: string
    returnTo?: string
    error?: string
  }>
}) {
  const query = loginPageQuerySchema.parse(await searchParams)
  const returnTo = normalizeCustomerReturnTo(query.returnTo)
  const isCreateMode = query.mode === 'create'
  const errorMessage =
    query.error ? errorMessages[query.error] : undefined

  return (
    <div className='relative isolate min-h-[calc(100svh-5rem)] overflow-hidden bg-background px-4 py-12 text-foreground sm:px-6 sm:py-20'>
      <div
        aria-hidden='true'
        className='absolute top-8 left-[8%] -z-10 size-64 rounded-full bg-cyan-500/10 blur-3xl'
      />
      <div
        aria-hidden='true'
        className='absolute right-[4%] bottom-10 -z-10 size-80 rounded-full bg-sidebar-primary/15 blur-3xl'
      />

      <div className='mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_32px_90px_-48px_rgba(0,0,0,0.9)] lg:grid-cols-[0.9fr_1.1fr]'>
        <section className='relative isolate hidden overflow-hidden bg-sidebar-primary p-10 text-sidebar-primary-foreground lg:flex lg:flex-col lg:justify-between'>
          <div
            aria-hidden='true'
            className='absolute -top-16 -right-16 -z-10 size-64 rounded-full border-42 border-white/10'
          />
          <div className='flex size-20 items-center justify-center rounded-[1.35rem] bg-cyan-500 text-[#172744] shadow-xl shadow-black/20'>
            <Heart
              className='size-10 fill-current stroke-[2.25]'
              aria-hidden='true'
            />
          </div>
          <div className='space-y-4'>
            <p className='text-sm font-utekos-text-medium tracking-[0.18em] opacity-75'>
              Din Utekos-konto
            </p>
            <p className='max-w-sm text-3xl leading-tight font-utekos-text-medium text-balance'>
              Lagre favoritter og finn dem igjen når det passer
              deg.
            </p>
          </div>
        </section>

        <section className='bg-popover px-6 py-9 text-popover-foreground sm:px-10 sm:py-12 lg:px-14'>
          <div className='mx-auto max-w-md'>
            <div className='mb-7 flex size-14 items-center justify-center rounded-2xl bg-cyan-500 text-[#172744] lg:hidden'>
              <Heart
                className='size-7 fill-current stroke-[2.25]'
                aria-hidden='true'
              />
            </div>

            <h1 className='text-3xl leading-tight font-utekos-text-medium sm:text-4xl'>
              {isCreateMode ? 'Opprett konto' : 'Logg inn'}
            </h1>
            <p className='mt-4 text-base leading-7 font-utekos-text text-foreground'>
              {isCreateMode ?
                'Opprett en Utekos-konto gjennom Shopify. Du trenger bare e-postadressen din for å komme i gang.'
              : 'Du kan logge inn med Utekos-kontoen din eller velge Facebook eller Google på den sikre Shopify-siden.'
              }
            </p>

            {errorMessage ?
              <p
                role='alert'
                className='mt-6 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive'
              >
                {errorMessage}
              </p>
            : null}

            <form
              action='/customer/account/authorize'
              method='get'
              className='mt-8 space-y-5'
            >
              <input
                type='hidden'
                name='mode'
                value={query.mode}
              />
              <input
                type='hidden'
                name='returnTo'
                value={returnTo}
              />

              <div className='space-y-2'>
                <label
                  htmlFor='customer-email'
                  className='text-sm font-medium'
                >
                  E-postadresse (valgfritt)
                </label>
                <Input
                  id='customer-email'
                  name='email'
                  type='email'
                  inputMode='email'
                  autoComplete='email'
                  placeholder='din@epost.no'
                  className='h-12 rounded-lg border-border bg-background px-4 text-base text-foreground focus-visible:border-primary focus-visible:ring-primary/35'
                />
              </div>

              <Button
                type='submit'
                variant='commerce-primary'
                size='lg'
                className='min-h-12 w-full rounded-full bg-cyan-500 px-6 text-base text-[#172744] shadow-sm hover:bg-cyan-400 hover:text-[#172744]'
              >
                {isCreateMode ?
                  'Opprett konto hos Shopify'
                : 'Fortsett til innlogging'}
                <ArrowRight aria-hidden='true' />
              </Button>
            </form>

            <div
              className='my-7 flex items-center gap-4'
              aria-hidden='true'
            >
              <span className='h-px flex-1 bg-border' />
              <span className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                Sikker innlogging
              </span>
              <span className='h-px flex-1 bg-border' />
            </div>

            <div className='flex items-start gap-3 rounded-xl border border-border bg-muted/25 p-4'>
              <LockKeyhole
                className='mt-0.5 size-5 shrink-0 text-sidebar-primary'
                aria-hidden='true'
              />
              <p className='text-sm leading-6 text-muted-foreground'>
                Shopify håndterer passordløs innlogging og
                tilgjengelige valg for Facebook, Google og Shop.
                Utekos får aldri tilgang til passordet ditt.
              </p>
            </div>

            <Link
              href={returnTo as Route}
              className='mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg py-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            >
              <ArrowLeft aria-hidden='true' />
              Tilbake
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
