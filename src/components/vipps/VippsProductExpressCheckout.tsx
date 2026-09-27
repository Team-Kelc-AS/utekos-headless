'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { mountVippsButton } from './vippsWidget'

type CheckoutResult = {
  redirectUrl: string
  checkoutMode: 'shopify' | 'vipps'
}

function VippsButton({
  resolve,
  onError
}: {
  resolve: () => Promise<CheckoutResult>
  onError: (message: string) => void
}) {
  const id = `vipps-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const resolveRef = useRef(resolve)
  const errorRef = useRef(onError)
  useEffect(() => {
    resolveRef.current = resolve
    errorRef.current = onError
  }, [resolve, onError])
  useEffect(() => {
    let disposed = false
    let unmount: (() => void) | undefined
    void mountVippsButton(`#${id}`, {
      resolve: () => resolveRef.current()
    })
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
  disabled = false
}: {
  handle: string
  variantId: string
  disabled?: boolean
}) {
  const [error, setError] = useState('')
  const attempt = useRef<string | null>(null)
  const attemptedItem = useRef<string | null>(null)
  const inFlight = useRef<
    Promise<CheckoutResult> | null
  >(null)

  async function start(): Promise<CheckoutResult> {
    if (inFlight.current) return inFlight.current
    const item = `${handle}:${variantId}`
    if (attemptedItem.current !== item) {
      attemptedItem.current = item
      attempt.current = null
    }
    attempt.current ??= crypto.randomUUID()
    setError('')
    inFlight.current = (async () => {
      try {
        const response = await fetch('/api/vipps/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle,
            variantId,
            attemptId: attempt.current
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
          resolve={start}
          onError={setError}
        />
      </div>
      {error ?
        <p role='alert' className='mt-2 text-sm'>
          {error}
        </p>
      : null}
    </div>
  )
}
