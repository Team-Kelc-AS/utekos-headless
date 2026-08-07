'use client'

import { useState } from 'react'

import {
  KlarnaExpressCheckoutButton,
  type KlarnaExpressCheckoutTheme
} from '@/components/klarna/components/KlarnaExpressCheckoutButton'
import { buildKlarnaExpressOrderPayloadFromCart } from '@/components/klarna/utils/buildKlarnaExpressOrderPayload'
import type { KlarnaExpressOrderPayload } from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import { reportCanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutReporter'
import { cn } from '@/lib/utils/className'
import type { Cart } from 'types/cart'

type KlarnaCartExpressCheckoutProps = {
  cart: Cart
  disabled?: boolean
  theme?: KlarnaExpressCheckoutTheme
  className?: string
  buttonContainerClassName?: string
}

export function KlarnaCartExpressCheckout({
  cart,
  disabled = false,
  theme = 'default',
  className,
  buttonContainerClassName
}: KlarnaCartExpressCheckoutProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  )

  let orderPayload: KlarnaExpressOrderPayload | null = null

  if (cart.lines.length > 0) {
    try {
      orderPayload = buildKlarnaExpressOrderPayloadFromCart(cart)
    } catch {
      orderPayload = null
    }
  }

  if (!orderPayload) {
    return null
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col items-stretch',
        className
      )}
    >
      <KlarnaExpressCheckoutButton
        key={`${cart.id}-${cart.totalQuantity}-${orderPayload.order_amount}-${theme}`}
        orderPayload={orderPayload}
        shopifyCartId={cart.id}
        disabled={disabled}
        theme={theme}
        className='h-full min-h-0'
        {...(buttonContainerClassName ?
          { buttonContainerClassName }
        : {})}
        onPrepareAuthorize={async () => {
          try {
            const preparedPayload =
              buildKlarnaExpressOrderPayloadFromCart(cart)

            await reportCanonicalBeginCheckout({
              cart,
              checkoutMethod: 'klarna_express'
            })

            setErrorMessage(null)
            return {
              orderPayload: preparedPayload,
              shopifyCartId: cart.id
            }
          } catch {
            setErrorMessage(
              'Handlekurven kunne ikke konverteres til Klarna-ordre.'
            )
            return null
          }
        }}
        onError={message => {
          setErrorMessage(message)
        }}
      />
      {errorMessage ?
        <p
          className='dark:text-dark-destructive mt-2 text-sm text-destructive'
          role='alert'
          aria-live='polite'
        >
          {errorMessage}
        </p>
      : null}
    </div>
  )
}
