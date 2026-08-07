'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  submitProductWaitlist,
  type ProductWaitlistActionState
} from '@/lib/actions/submitProductWaitlist'
import { appendLeadTrackingContext } from '@/lib/analytics/collectLeadFormTrackingContext'
import { pushGenerateLeadToDataLayer } from '@/lib/analytics/pushGenerateLeadToDataLayer'
import { Check, Clock3, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'

const initialState: ProductWaitlistActionState = {
  status: 'idle',
  message: ''
}

const fieldClassName =
  'h-12 rounded-lg border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/35 dark:border-dark-border dark:bg-dark-background dark:text-dark-foreground dark:placeholder:text-dark-muted-foreground dark:focus-visible:border-dark-primary dark:focus-visible:ring-dark-primary/35'

export function SoldOutWaitlistDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    submitProductWaitlist,
    initialState
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(true)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (state.status === 'success' && state.dataLayerEvent) {
      pushGenerateLeadToDataLayer(state.dataLayerEvent)
    }
  }, [state])

  const handleSubmit = (formData: FormData) => {
    appendLeadTrackingContext(formData)
    formAction(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-xl'>
        <div className='overflow-hidden rounded-xl'>
          <div className='relative isolate overflow-hidden bg-card px-6 pt-7 pb-6 text-card-foreground sm:px-8'>
            <div
              aria-hidden='true'
              className='absolute -top-16 -right-12 -z-10 size-48 rounded-full bg-sidebar-primary/35 blur-3xl'
            />
            <div className='mb-5 flex size-14 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/15'>
              <Clock3 className='size-7' aria-hidden='true' />
            </div>
            <DialogHeader className='pr-8'>
              <DialogTitle className='font-utekos-text-medium text-2xl leading-tight text-card-foreground sm:text-3xl'>
                Utsolgt akkurat nå
              </DialogTitle>
              <DialogDescription className='text-base leading-7 text-card-foreground/80 dark:text-card-foreground/80'>
                Utekos Dun er dessverre utsolgt. Sett deg på
                ventelisten helt kostnadsfritt, så gir vi beskjed
                når den er tilbake.
              </DialogDescription>
            </DialogHeader>
          </div>

          {state.status === 'success' ?
            <div
              className='grid min-h-72 place-items-center bg-popover px-6 py-10 text-center text-popover-foreground'
              aria-live='polite'
            >
              <div className='flex max-w-sm flex-col items-center gap-4'>
                <span className='flex size-14 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground'>
                  <Check className='size-7' aria-hidden='true' />
                </span>
                <h2 className='font-utekos-text-medium text-xl'>
                  Du står på ventelisten
                </h2>
                <p className='dark:text-dark-muted-foreground leading-6 text-muted-foreground'>
                  {state.message}
                </p>
                <Button
                  type='button'
                  variant='outline'
                  size='lg'
                  onClick={() => setOpen(false)}
                  className='mt-2 min-h-11 px-6'
                >
                  Fortsett å se
                </Button>
              </div>
            </div>
          : <form
              action={handleSubmit}
              className='space-y-5 bg-popover px-6 py-7 text-popover-foreground sm:px-8'
              noValidate
            >
              <input
                type='hidden'
                name='productHandle'
                value='utekos-dun'
              />
              <input type='hidden' name='website' value='' />

              <div className='space-y-2'>
                <label
                  htmlFor='waitlist-name'
                  className='text-sm font-medium'
                >
                  Navn
                </label>
                <Input
                  id='waitlist-name'
                  name='name'
                  autoComplete='name'
                  placeholder='Ditt navn'
                  required
                  aria-invalid={Boolean(state.errors?.name)}
                  aria-describedby={
                    state.errors?.name ?
                      'waitlist-name-error'
                    : undefined
                  }
                  className={fieldClassName}
                />
                {state.errors?.name?.[0] ?
                  <p
                    id='waitlist-name-error'
                    role='alert'
                    className='text-sm text-destructive'
                  >
                    {state.errors.name[0]}
                  </p>
                : null}
              </div>

              <div className='grid gap-5 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <label
                    htmlFor='waitlist-phone'
                    className='text-sm font-medium'
                  >
                    Telefon
                  </label>
                  <Input
                    id='waitlist-phone'
                    name='phone'
                    type='tel'
                    inputMode='tel'
                    autoComplete='tel'
                    placeholder='+47 123 45 678'
                    required
                    aria-invalid={Boolean(state.errors?.phone)}
                    aria-describedby={
                      state.errors?.phone ?
                        'waitlist-phone-error'
                      : undefined
                    }
                    className={fieldClassName}
                  />
                  {state.errors?.phone?.[0] ?
                    <p
                      id='waitlist-phone-error'
                      role='alert'
                      className='text-sm text-destructive'
                    >
                      {state.errors.phone[0]}
                    </p>
                  : null}
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='waitlist-email'
                    className='text-sm font-medium'
                  >
                    E-post
                  </label>
                  <Input
                    id='waitlist-email'
                    name='email'
                    type='email'
                    inputMode='email'
                    autoComplete='email'
                    placeholder='din@epost.no'
                    required
                    aria-invalid={Boolean(state.errors?.email)}
                    aria-describedby={
                      state.errors?.email ?
                        'waitlist-email-error'
                      : undefined
                    }
                    className={fieldClassName}
                  />
                  {state.errors?.email?.[0] ?
                    <p
                      id='waitlist-email-error'
                      role='alert'
                      className='text-sm text-destructive'
                    >
                      {state.errors.email[0]}
                    </p>
                  : null}
                </div>
              </div>

              <div className='space-y-2'>
                <label className='dark:border-dark-border dark:bg-dark-muted/25 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/25 p-4'>
                  <input
                    type='checkbox'
                    name='privacy'
                    required
                    aria-invalid={Boolean(state.errors?.privacy)}
                    aria-describedby={
                      state.errors?.privacy ?
                        'waitlist-privacy-error'
                      : undefined
                    }
                    className='mt-1 size-4 shrink-0 accent-primary'
                  />
                  <span className='text-sm leading-6'>
                    Jeg bekrefter at jeg har lest{' '}
                    <Link
                      href='/personvern'
                      className='font-medium underline underline-offset-4'
                    >
                      personvernerklæringen
                    </Link>
                    , som forklarer hvordan Utekos bruker
                    opplysningene til å kontakte meg om Utekos
                    Dun. Dette er ikke påmelding til
                    markedsføring.
                  </span>
                </label>
                {state.errors?.privacy?.[0] ?
                  <p
                    id='waitlist-privacy-error'
                    role='alert'
                    className='text-sm text-destructive'
                  >
                    {state.errors.privacy[0]}
                  </p>
                : null}
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='waitlist-marketing'
                  className='dark:border-dark-border dark:bg-dark-muted/25 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/25 p-4'
                >
                  <input
                    id='waitlist-marketing'
                    type='checkbox'
                    name='marketing'
                    className='mt-1 size-4 shrink-0 accent-primary'
                  />
                  <span className='text-sm leading-6'>
                    Jeg samtykker til å motta nyheter og
                    eksklusive tilbud fra Utekos på e-post. Du kan
                    når som helst melde deg av.
                  </span>
                </label>
              </div>

              {state.status === 'error' && state.message ?
                <p
                  role='alert'
                  className='rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive'
                >
                  {state.message}
                </p>
              : null}

              <Button
                type='submit'
                variant='commerce-primary'
                size='lg'
                disabled={isPending}
                aria-busy={isPending}
                className='min-h-12 w-full rounded-full bg-primary px-6 text-base text-foreground font-utekos-text-medium shadow-sm hover:opacity-60'
              >
                {isPending ?
                  <>
                    <Loader2
                      className='animate-spin'
                      aria-hidden='true'
                    />
                    Registrerer…
                  </>
                : 'Sett meg på ventelisten'}
              </Button>
            </form>
          }
        </div>
      </DialogContent>
    </Dialog>
  )
}
