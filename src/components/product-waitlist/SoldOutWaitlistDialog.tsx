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
import type { ProductWaitlistEntryPoint } from '@/db/zod/schemas/ProductWaitlistSchema'
import {
  submitProductWaitlist,
  type ProductWaitlistActionState
} from '@/lib/actions/submitProductWaitlist'
import { appendLeadTrackingContext } from '@/lib/analytics/collectLeadFormTrackingContext'
import { pushGenerateLeadToDataLayer } from '@/lib/analytics/pushGenerateLeadToDataLayer'
import { Check, Clock3, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useId, useState } from 'react'

const initialState: ProductWaitlistActionState = {
  status: 'idle',
  message: ''
}

const DEFAULT_AUTO_OPEN_DELAY_MS = 3000

const fieldClassName =
  'h-12 rounded-lg border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/35 dark:border-dark-border dark:bg-dark-background dark:text-dark-foreground dark:placeholder:text-dark-muted-foreground dark:focus-visible:border-dark-primary dark:focus-visible:ring-dark-primary/35'

export type SoldOutWaitlistDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  autoOpenDelayMs?: number | null
  entryPoint?: ProductWaitlistEntryPoint
}

export function SoldOutWaitlistDialog({
  open: openProp,
  onOpenChange,
  autoOpenDelayMs = DEFAULT_AUTO_OPEN_DELAY_MS,
  entryPoint = 'product_page'
}: SoldOutWaitlistDialogProps = {}) {
  const fieldId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const [state, formAction, isPending] = useActionState(
    submitProductWaitlist,
    initialState
  )

  useEffect(() => {
    if (typeof autoOpenDelayMs !== 'number') {
      return
    }

    const timer = window.setTimeout(() => {
      if (!isControlled) {
        setUncontrolledOpen(true)
      }
      onOpenChange?.(true)
    }, autoOpenDelayMs)

    return () => window.clearTimeout(timer)
  }, [autoOpenDelayMs, isControlled, onOpenChange])

  useEffect(() => {
    if (state.status === 'success' && state.dataLayerEvent) {
      pushGenerateLeadToDataLayer(state.dataLayerEvent)
    }
  }, [state])

  const handleSubmit = (formData: FormData) => {
    appendLeadTrackingContext(formData)
    formAction(formData)
  }

  const nameFieldId = `${fieldId}-waitlist-name`
  const phoneFieldId = `${fieldId}-waitlist-phone`
  const emailFieldId = `${fieldId}-waitlist-email`
  const marketingFieldId = `${fieldId}-waitlist-marketing`
  const nameErrorId = `${fieldId}-waitlist-name-error`
  const phoneErrorId = `${fieldId}-waitlist-phone-error`
  const emailErrorId = `${fieldId}-waitlist-email-error`
  const privacyErrorId = `${fieldId}-waitlist-privacy-error`

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
              <input
                type='hidden'
                name='entryPoint'
                value={entryPoint}
              />
              <input type='hidden' name='website' value='' />

              <div className='space-y-2'>
                <label
                  htmlFor={nameFieldId}
                  className='text-sm font-medium'
                >
                  Navn
                </label>
                <Input
                  id={nameFieldId}
                  name='name'
                  autoComplete='name'
                  placeholder='Ditt navn'
                  required
                  aria-invalid={Boolean(state.errors?.name)}
                  aria-describedby={
                    state.errors?.name ? nameErrorId : undefined
                  }
                  className={fieldClassName}
                />
                {state.errors?.name?.[0] ?
                  <p
                    id={nameErrorId}
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
                    htmlFor={phoneFieldId}
                    className='text-sm font-medium'
                  >
                    Telefon
                  </label>
                  <Input
                    id={phoneFieldId}
                    name='phone'
                    type='tel'
                    inputMode='tel'
                    autoComplete='tel'
                    placeholder='+47 123 45 678'
                    required
                    aria-invalid={Boolean(state.errors?.phone)}
                    aria-describedby={
                      state.errors?.phone ?
                        phoneErrorId
                      : undefined
                    }
                    className={fieldClassName}
                  />
                  {state.errors?.phone?.[0] ?
                    <p
                      id={phoneErrorId}
                      role='alert'
                      className='text-sm text-destructive'
                    >
                      {state.errors.phone[0]}
                    </p>
                  : null}
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor={emailFieldId}
                    className='text-sm font-medium'
                  >
                    E-post
                  </label>
                  <Input
                    id={emailFieldId}
                    name='email'
                    type='email'
                    inputMode='email'
                    autoComplete='email'
                    placeholder='din@epost.no'
                    required
                    aria-invalid={Boolean(state.errors?.email)}
                    aria-describedby={
                      state.errors?.email ?
                        emailErrorId
                      : undefined
                    }
                    className={fieldClassName}
                  />
                  {state.errors?.email?.[0] ?
                    <p
                      id={emailErrorId}
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
                        privacyErrorId
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
                    id={privacyErrorId}
                    role='alert'
                    className='text-sm text-destructive'
                  >
                    {state.errors.privacy[0]}
                  </p>
                : null}
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor={marketingFieldId}
                  className='dark:border-dark-border dark:bg-dark-muted/25 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/25 p-4'
                >
                  <input
                    id={marketingFieldId}
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
