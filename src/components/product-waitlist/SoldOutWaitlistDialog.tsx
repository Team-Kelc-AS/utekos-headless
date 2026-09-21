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
import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useId, useState } from 'react'

const initialState: ProductWaitlistActionState = {
  status: 'idle',
  message: ''
}

const DEFAULT_AUTO_OPEN_DELAY_MS = 3000

const fieldClassName =
  'h-12 rounded-lg border-border bg-jungle px-4 text-base text-foreground placeholder:text-foreground/45 focus-visible:border-primary focus-visible:ring-primary/35'

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
      <DialogContent className='max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto border-0 bg-night p-0 text-foreground ring-foreground/15 sm:max-w-lg'>
        <div className='px-6 pt-6 pr-14 pb-0 sm:px-7 sm:pt-7'>
          <DialogHeader className='gap-0'>
            <div className='flex items-start gap-3'>
              <img
                src='/low_stock.svg'
                alt=''
                aria-hidden='true'
                className='mt-0.5 size-9 shrink-0 sm:size-10'
              />
              <div className='min-w-0 space-y-3'>
                <DialogTitle className='font-sans font-semibold text-[1.65rem] leading-[1.15] tracking-[-0.02em] text-foreground sm:text-3xl'>
                  Sikre deg førsterett!
                </DialogTitle>
                <DialogDescription className='max-w-[40ch] text-[0.95rem] leading-6 text-foreground/78'>
                  Utekos Dun ble revet bort raskere enn
                  forventet, men en ny leveranse er rett rundt
                  hjørnet! Meld deg på vår gratis venteliste for
                  å få førsterett og sikre deg din før vi åpner
                  salget for alle andre.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

          {state.status === 'success' ?
            <div
              className='grid place-items-center px-6 py-8 text-center sm:px-7'
              aria-live='polite'
            >
              <div className='flex max-w-sm flex-col items-center gap-3'>
                <span className='flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                  <Check className='size-6' aria-hidden='true' />
                </span>
                <h2 className='font-sans font-semibold text-xl'>
                  Du står på ventelisten
                </h2>
                <p className='leading-6 text-foreground/72'>
                  {state.message}
                </p>
                <Button
                  type='button'
                  variant='outline'
                  size='lg'
                  onClick={() => setOpen(false)}
                  className='mt-1 min-h-11 border-border px-6'
                >
                  Fortsett å se
                </Button>
              </div>
            </div>
          : <form
              action={handleSubmit}
              className='space-y-4 px-6 pt-5 pb-6 sm:px-7 sm:pb-7'
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

              <div className='grid gap-4 sm:grid-cols-2'>
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

              <div className='space-y-3 border-t border-border/70 pt-4'>
                <label className='flex cursor-pointer items-start gap-3'>
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
                    className='mt-0.5 size-4 shrink-0 accent-primary'
                  />
                  <span className='text-sm leading-5 text-foreground/80'>
                    Jeg har lest{' '}
                    <Link
                      href='/personvern'
                      className='font-medium text-foreground underline underline-offset-4'
                    >
                      personvernerklæringen
                    </Link>
                    {' '}
                    og godtar at Utekos kontakter meg om Utekos
                    Dun. Dette er ikke markedsføring.
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
                <label
                  htmlFor={marketingFieldId}
                  className='flex cursor-pointer items-start gap-3'
                >
                  <input
                    id={marketingFieldId}
                    type='checkbox'
                    name='marketing'
                    className='mt-0.5 size-4 shrink-0 accent-primary'
                  />
                  <span className='text-sm leading-5 text-foreground/80'>
                    Send meg nyheter og tilbud på e-post. Jeg kan
                    melde meg av når som helst.
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

              <div className='space-y-2 pt-1'>
                <Button
                  type='submit'
                  variant='commerce-primary'
                  size='lg'
                  disabled={isPending}
                  aria-busy={isPending}
                  className='min-h-12 w-full rounded-full bg-primary px-6 font-sans font-semibold text-base text-primary-foreground shadow-none hover:bg-primary/90'
                >
                  {isPending ?
                    <>
                      <Loader2
                        className='animate-spin'
                        aria-hidden='true'
                      />
                      Registrerer…
                    </>
                  : 'Sikre førsterett'}
                </Button>
              </div>
            </form>
          }
      </DialogContent>
    </Dialog>
  )
}
