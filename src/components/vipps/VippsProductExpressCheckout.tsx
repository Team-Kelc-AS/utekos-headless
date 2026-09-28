'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import {
  vippsPaymentDescription,
  type VippsSelectedOption
} from '@/lib/vipps/productDescription'
import { mountVippsButton } from './vippsWidget'
import styles from './VippsPurchaseConfirmation.module.css'
import { vippsDisplay, vippsText } from './vippsFonts'

type CheckoutResult = {
  redirectUrl: string
  checkoutMode: 'shopify' | 'vipps'
}

function VippsButton({
  resolve,
  onError,
  className
}: {
  resolve: () => Promise<CheckoutResult>
  onError: (message: string) => void
  className?: string | undefined
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
  return (
    <div id={id} className={className ?? 'min-h-12 w-full'} />
  )
}

export function VippsProductExpressCheckout({
  handle,
  variantId,
  productTitle,
  selectedOptions,
  price,
  disabled = false
}: {
  handle: string
  variantId: string
  productTitle: string
  selectedOptions: VippsSelectedOption[]
  price: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const attempt = useRef<string | null>(null)
  const attemptedItem = useRef<string | null>(null)
  const inFlight = useRef<Promise<CheckoutResult> | null>(null)

  async function start(): Promise<CheckoutResult> {
    if (inFlight.current) return inFlight.current
    const item = `${handle}:${variantId}`
    if (attemptedItem.current !== item) {
      attemptedItem.current = item
      attempt.current = null
    }
    attempt.current ??= crypto.randomUUID()
    setError('')
    setIsStarting(true)
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
        setIsStarting(false)
      }
    })()
    return inFlight.current
  }

  const itemName = vippsPaymentDescription(
    productTitle,
    selectedOptions
  )

  return (
    <div
      className='w-full'
      onClick={event => event.stopPropagation()}
    >
      <button
        type='button'
        className={`${styles.trigger} ${vippsText.variable}`}
        disabled={disabled}
        aria-haspopup='dialog'
        onClick={() => {
          setError('')
          setOpen(true)
        }}
      >
        Sjekk kjøpet
      </button>

      <Dialog
        open={open}
        onOpenChange={nextOpen => {
          if (!nextOpen && isStarting) return
          setOpen(nextOpen)
        }}
      >
        <DialogContent
          showCloseButton={false}
          aria-modal='true'
          className={`${styles.dialog} ${vippsDisplay.variable} ${vippsText.variable}`}
        >
          <div className={styles.visual} aria-hidden='true'>
            <Image
              src='/vipps/payment-integration-300x300.svg'
              alt=''
              width={300}
              height={300}
              className={styles.illustration}
              priority={false}
            />
          </div>

          <DialogClose
            render={
              <button
                type='button'
                className={styles.close}
                disabled={isStarting}
                aria-label='Lukk kjøpsoversikten'
              />
            }
          >
            <span
              className={styles.closeIcon}
              aria-hidden='true'
            />
          </DialogClose>

          <div className={styles.content}>
            <DialogTitle className={styles.title}>
              Sjekk kjøpet
            </DialogTitle>
            <DialogDescription className={styles.description}>
              Se at produkt, farge og størrelse stemmer før du
              går videre til Vipps.
            </DialogDescription>

            <section
              className={styles.purchase}
              aria-label='Produkt som skal betales med Vipps'
            >
              <p className={styles.eyebrow}>Dette kjøper du</p>
              <p className={styles.product}>{itemName}</p>
              <p className={styles.price}>{price}</p>
            </section>

            <div className={styles.actions}>
              <div inert={disabled} aria-disabled={disabled}>
                <VippsButton
                  resolve={start}
                  onError={setError}
                  className={styles.vippsButton}
                />
              </div>
              <DialogClose
                render={
                  <button
                    type='button'
                    className={styles.back}
                    disabled={isStarting}
                  />
                }
              >
                Endre valget
              </DialogClose>
            </div>

            {error ?
              <p role='alert' className={styles.error}>
                {error}
              </p>
            : null}

            <p className={styles.note}>
              Neste steg åpnes og fullføres sikkert hos Vipps.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
