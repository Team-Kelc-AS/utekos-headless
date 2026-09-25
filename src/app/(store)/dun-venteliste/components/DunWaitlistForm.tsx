'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appendLeadTrackingContext } from '@/lib/analytics/collectLeadFormTrackingContext'
import { pushGenerateLeadToDataLayer } from '@/lib/analytics/pushGenerateLeadToDataLayer'
import {
  submitDunWaitlistPage,
  type DunWaitlistPageActionState
} from '@/lib/actions/submitDunWaitlistPage'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useId, useRef, useState } from 'react'

const initialState: DunWaitlistPageActionState = {
  status: 'idle',
  message: ''
}

export function DunWaitlistForm() {
  const fieldId = useId()
  const statusRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [state, formAction, isPending] = useActionState(
    submitDunWaitlistPage,
    initialState
  )

  useEffect(() => {
    if (
      state.status === 'success' &&
      state.dataLayerEvent
    ) {
      pushGenerateLeadToDataLayer(state.dataLayerEvent)
    }
  }, [state])

  useEffect(() => {
    if (state.status !== 'success') return
    statusRef.current?.focus()
  }, [state.status])

  const emailFieldId = `${fieldId}-email`
  const phoneFieldId = `${fieldId}-phone`
  const emailErrorId = `${fieldId}-email-error`
  const phoneErrorId = `${fieldId}-phone-error`

  if (state.status === 'success') {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role='status'
        aria-live='polite'
        className='mt-8 space-y-3 outline-none'
      >
        <h2 className='font-sans text-2xl font-semibold tracking-[-0.02em] text-foreground'>
          Du står på ventelisten.
        </h2>
        <p className='text-base leading-7 text-foreground/80'>
          Vi gir deg beskjed når Utekos Dun blir tilgjengelig
          igjen.
        </p>
      </div>
    )
  }

  return (
    <form
      action={formData => {
        appendLeadTrackingContext(formData)
        formAction(formData)
      }}
      className='mt-8 space-y-5'
      noValidate
    >
      <input
        type='hidden'
        name='website'
        defaultValue=''
      />

      <div className='space-y-2'>
        <label
          htmlFor={emailFieldId}
          className='text-sm font-medium text-foreground'
        >
          E-post{' '}
          <span aria-hidden='true'>*</span>
          <span className='sr-only'> (obligatorisk)</span>
        </label>
        <Input
          id={emailFieldId}
          name='email'
          type='email'
          inputMode='email'
          autoComplete='email'
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={
            state.errors?.email ? emailErrorId : undefined
          }
          className='h-12 px-4 text-base md:text-base'
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

      <div className='space-y-2'>
        <label
          htmlFor={phoneFieldId}
          className='text-sm font-medium text-foreground'
        >
          Mobilnummer{' '}
          <span aria-hidden='true'>*</span>
          <span className='sr-only'> (obligatorisk)</span>
        </label>
        <Input
          id={phoneFieldId}
          name='phone'
          type='tel'
          inputMode='tel'
          autoComplete='tel'
          required
          value={phone}
          onChange={event => setPhone(event.target.value)}
          aria-invalid={Boolean(state.errors?.phone)}
          aria-describedby={
            state.errors?.phone ? phoneErrorId : undefined
          }
          className='h-12 px-4 text-base md:text-base'
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

      {state.status === 'error' &&
      state.message &&
      !state.errors ?
        <p
          role='alert'
          className='text-sm text-destructive'
        >
          {state.message}
        </p>
      : null}

      <Button
        type='submit'
        variant='commerce-primary'
        disabled={isPending}
        aria-busy={isPending}
        className='min-h-11 w-full px-6 text-base'
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

      <p className='text-sm leading-6 text-foreground/70'>
        Vi bruker e-post og mobilnummer bare til å si fra når
        Utekos Dun er tilbake.{' '}
        <Link
          href='/personvern'
          className='font-medium text-foreground underline underline-offset-4'
        >
          Personvernerklæring
        </Link>
      </p>
    </form>
  )
}
