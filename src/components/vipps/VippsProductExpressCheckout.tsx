'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { mountVippsButton } from './vippsWidget'

function VippsButton({
  action,
  onError
}: {
  action:
    | { click: () => void }
    | {
        resolve: () => Promise<{
          redirectUrl: string
          checkoutMode: 'shopify' | 'vipps'
        }>
      }
  onError: (message: string) => void
}) {
  const id = `vipps-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const actionRef = useRef(action)
  const errorRef = useRef(onError)
  useEffect(() => {
    actionRef.current = action
    errorRef.current = onError
  }, [action, onError])
  useEffect(() => {
    let disposed = false
    let unmount: (() => void) | undefined
    const stableAction =
      'resolve' in actionRef.current ?
        {
          resolve: async () => {
            const current = actionRef.current
            if (!('resolve' in current))
              throw new Error('Payment unavailable')
            return current.resolve()
          }
        }
      : {
          click: () => {
            const current = actionRef.current
            if ('click' in current) current.click()
          }
        }
    void mountVippsButton(`#${id}`, stableAction)
      .then(cleanup => {
        if (disposed) cleanup()
        else unmount = cleanup
      })
      .catch(() =>
        errorRef.current(
          'Vipps-knappen kunne ikke lastes. Prøv å laste siden på nytt.'
        )
      )
    return () => {
      disposed = true
      unmount?.()
    }
  }, [id])
  return <div id={id} className='min-h-12 w-full' />
}

export function VippsProductExpressCheckout({
  handle,
  variantId,
  title,
  variantTitle,
  price,
  disabled = false
}: {
  handle: string
  variantId: string
  title: string
  variantTitle: string
  price: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [busy, setBusy] = useState(false)
  const attempt = useRef<string | null>(null)
  const inFlight = useRef<
    Promise<{
      redirectUrl: string
      checkoutMode: 'shopify' | 'vipps'
    }> | null
  >(null)
  const [selected, setSelected] = useState({
    handle,
    variantId,
    title,
    variantTitle,
    price
  })
  function showTerms() {
    if (disabled || busy) return
    const changed = selected.variantId !== variantId
    setSelected({
      handle,
      variantId,
      title,
      variantTitle,
      price
    })
    if (changed) attempt.current = null
    setAccepted(false)
    setError('')
    setOpen(true)
  }
  async function start() {
    if (!accepted) throw new Error('Terms must be accepted')
    if (inFlight.current) return inFlight.current
    attempt.current ??= crypto.randomUUID()
    setBusy(true)
    setError('')
    inFlight.current = (async () => {
      try {
        const response = await fetch('/api/vipps/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle: selected.handle,
            variantId: selected.variantId,
            attemptId: attempt.current,
            ...(discountCode.trim() ?
              { discountCode: discountCode.trim() }
            : {}),
            termsAccepted: true
          })
        })
        const result: unknown = await response.json()
        if (
          !response.ok ||
          typeof result !== 'object' ||
          result === null ||
          !('redirectUrl' in result) ||
          typeof result.redirectUrl !== 'string' ||
          !('checkoutMode' in result) ||
          (result.checkoutMode !== 'shopify' &&
            result.checkoutMode !== 'vipps')
        )
          throw new Error('checkout failed')
        return {
          redirectUrl: result.redirectUrl,
          checkoutMode: result.checkoutMode
        }
      } catch {
        setError(
          'Betalingen kunne ikke startes. Prøv igjen; vi bruker samme betalingsforsøk for å unngå dobbeltbetaling.'
        )
        throw new Error('Vipps checkout could not be started')
      } finally {
        setBusy(false)
        inFlight.current = null
      }
    })()
    return inFlight.current
  }
  return (
    <div
      className='w-full'
      onClick={event => event.stopPropagation()}
    >
      <div inert={disabled} aria-disabled={disabled}>
        <VippsButton
          action={{ click: showTerms }}
          onError={setError}
        />
      </div>
      {!open && error ?
        <p role='alert' className='mt-2 text-sm'>
          {error}
        </p>
      : null}
      <Dialog
        open={open}
        onOpenChange={value => {
          if (!busy) setOpen(value)
        }}
      >
        <DialogContent>
          <DialogTitle>Kjøp med Vipps</DialogTitle>
          <DialogDescription>
            Kontroller varianten. Leveringsadresse og frakt
            velges i Vipps.
          </DialogDescription>
          <div>
            <p className='font-medium'>{selected.title}</p>
            <p>{selected.variantTitle}</p>
            <p>{selected.price}</p>
          </div>
          <p className='text-sm'>
            Du kjøper én av denne varianten. Andre varer i
            handlekurven er ikke med. Endelig totalpris,
            inkludert frakt, vises i Vipps før du godkjenner.
          </p>
          <label className='grid gap-1 text-sm'>
            Rabattkode (valgfritt)
            <input
              value={discountCode}
              disabled={busy}
              onChange={event => {
                attempt.current = null
                setDiscountCode(event.target.value)
              }}
              autoComplete='off'
              className='rounded border px-3 py-2'
            />
          </label>
          <label className='flex items-start gap-3 text-sm'>
            <input
              type='checkbox'
              checked={accepted}
              disabled={busy}
              onChange={event =>
                setAccepted(event.target.checked)
              }
              className='mt-1 size-5 shrink-0'
            />
            <span>
              Jeg godtar{' '}
              <Link
                href='/vilkar-betingelser'
                target='_blank'
                rel='noopener noreferrer'
                className='underline'
              >
                salgsbetingelsene
              </Link>{' '}
              og har lest{' '}
              <Link
                href='/personvern'
                target='_blank'
                rel='noopener noreferrer'
                className='underline'
              >
                personvernerklæringen
              </Link>
              .
            </span>
          </label>
          {accepted ?
            <VippsButton
              action={{ resolve: start }}
              onError={setError}
            />
          : <p className='text-sm'>
              Godta salgsbetingelsene for å fortsette til Vipps.
            </p>
          }
          {busy ?
            <p role='status'>Starter Vipps …</p>
          : null}
          {error ?
            <p role='alert'>{error}</p>
          : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
