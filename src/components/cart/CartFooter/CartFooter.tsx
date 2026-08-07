// Path: src/components/cart/CartFooter/CartFooter.tsx
import * as React from 'react'

import { CheckoutButton } from '@/components/cart/CheckoutButton/CheckoutButton'
import { KlarnaCartExpressCheckout } from '@/components/klarna/components/KlarnaCartExpressCheckout'
import { DrawerFooter } from '@/components/ui/drawer'
import { useCartPending } from '@/hooks/useCartPending'
import { formatPrice } from '@/lib/utils/formatPrice'
import { SubtotalDisplay } from './SubTotalDisplay'
import { shouldRenderFooter } from './utils/shouldRenderFooter'
import type { Cart } from 'types/cart'

export const CartFooter = ({
  cart
}: {
  cart: Cart | null | undefined
}): React.JSX.Element | null => {
  const isPending = useCartPending()

  if (!shouldRenderFooter(cart)) {
    return null
  }

  const unavailableLines = cart!.lines.filter(
    line => !line.merchandise.availableForSale
  )

  const hasUnavailableLines = unavailableLines.length > 0
  const isCheckoutPending = isPending > 0

  const subtotalFormatted = formatPrice(cart!.cost.subtotalAmount)

  const disabledReason =
    hasUnavailableLines ?
      'Fjern utsolgte varer fra handlekurven før du går til kassen.'
    : undefined

  return (
    <DrawerFooter className='border-t border-border bg-jungle'>
      {hasUnavailableLines && (
        <div
          role='alert'
          className='rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm leading-snug text-destructive'
        >
          En eller flere varer i handlekurven er ikke lenger
          tilgjengelige. Fjern dem før du går til kassen.
        </div>
      )}

      <SubtotalDisplay subtotal={subtotalFormatted} />

      <div className='mt-4 grid gap-3'>
        <CheckoutButton
          checkoutUrl={cart!.checkoutUrl}
          subtotal={subtotalFormatted}
          isPending={isCheckoutPending}
          disabled={hasUnavailableLines}
          {...(disabledReason === undefined ? {} : { disabledReason })}
          cart={cart!}
          variant='checkout'
          className='h-auto min-h-11 py-3.5 rounded-4xl hover:opacity-60 text-base font-utekos-text-medium text-foreground hover:bg-primary/90'
        />
        <KlarnaCartExpressCheckout
          cart={cart!}
          disabled={hasUnavailableLines || isCheckoutPending}
          theme='default'
          className='w-full min-w-0'
          buttonContainerClassName='h-14 min-h-14 border-none ring-0'
        />
      </div>
    </DrawerFooter>
  )
}
