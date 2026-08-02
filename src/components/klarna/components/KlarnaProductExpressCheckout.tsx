'use client'

import { useContext, useState } from 'react'

import {
  KlarnaExpressCheckoutButton,
  type KlarnaExpressCheckoutTheme
} from '@/components/klarna/components/KlarnaExpressCheckoutButton'
import { buildKlarnaExpressOrderPayloadFromProductLine } from '@/components/klarna/utils/buildKlarnaExpressOrderPayload'
import { prepareKlarnaExpressBeginCheckout } from '@/components/klarna/utils/prepareKlarnaExpressBeginCheckout'
import type { KlarnaExpressOrderPayload } from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'
import { reportCanonicalAddToCart } from '@/lib/analytics/addToCartReporter'
import { reportCanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutReporter'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { useCartMutations } from '@/hooks/useCartMutations'
import { cn } from '@/lib/utils/className'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type KlarnaProductExpressCheckoutProps = {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant | null
  quantity?: number
  disabled?: boolean
  theme?: KlarnaExpressCheckoutTheme
  className?: string
  buttonContainerClassName?: string
}

export function KlarnaProductExpressCheckout({
  product,
  selectedVariant,
  quantity = 1,
  disabled = false,
  theme = 'default',
  className,
  buttonContainerClassName
}: KlarnaProductExpressCheckoutProps) {
  const { addLines } = useCartMutations()
  const contextCartId = useContext(CartIdContext)
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null)

  let orderPayload: KlarnaExpressOrderPayload | null = null

  if (selectedVariant?.availableForSale && quantity >= 1) {
    try {
      orderPayload =
        buildKlarnaExpressOrderPayloadFromProductLine({
          product,
          variant: selectedVariant,
          quantity
        })
    } catch {
      orderPayload = null
    }
  }

  if (!orderPayload || !selectedVariant?.availableForSale) {
    return null
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full items-stretch',
        className
      )}
    >
      <KlarnaExpressCheckoutButton
        key={`${selectedVariant.id}-${quantity}-${orderPayload.order_amount}-${theme}`}
        orderPayload={orderPayload}
        disabled={disabled || !selectedVariant.availableForSale}
        theme={theme}
        className='h-full min-h-0'
        {...(buttonContainerClassName ?
          { buttonContainerClassName }
        : {})}
        onPrepareAuthorize={async () => {
          if (!selectedVariant) {
            return null
          }

          const prepared =
            await prepareKlarnaExpressBeginCheckout({
              product,
              variant: selectedVariant,
              quantity,
              contextCartId,
              addLines,
              getCartIdFromCookie,
              reportAddToCart: reportCanonicalAddToCart,
              reportBeginCheckout: reportCanonicalBeginCheckout
            })

          if (!prepared.ok) {
            setErrorMessage(prepared.message)
            return null
          }

          setErrorMessage(null)
          return {
            orderPayload: prepared.orderPayload,
            shopifyCartId: prepared.shopifyCartId
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
