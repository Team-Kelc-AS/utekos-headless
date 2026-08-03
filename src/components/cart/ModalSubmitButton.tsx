'use client'

import { SoldOutButton } from './SoldOutButton'
import { QuickCheckoutButton } from './QuickCheckoutButton'
import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { CheckoutPresentation } from 'types/cart'

interface ModalSubmitButtonProps {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant | null
  quantity: number
  availableForSale: boolean
  isCheckoutPending: boolean
  isDisabled: boolean
  onCheckout: () => void
  checkoutPresentation?: CheckoutPresentation
}

export function ModalSubmitButton({
  product,
  selectedVariant,
  quantity,
  availableForSale,
  isCheckoutPending,
  isDisabled,
  onCheckout,
  checkoutPresentation = 'balanced'
}: ModalSubmitButtonProps) {
  if (!availableForSale || !selectedVariant) {
    return <SoldOutButton />
  }

  if (checkoutPresentation === 'standard-primary') {
    return (
      <div className='grid gap-3'>
        <QuickCheckoutButton
          isPending={isCheckoutPending}
          isDisabled={isDisabled}
          onClick={onCheckout}
          className='bg-primary text-foreground hover:bg-primary/90 [&_svg]:text-foreground'
        />
        <div className='flex items-center gap-3 text-xs text-foreground/60'>
        </div>
        <KlarnaProductExpressCheckout
          product={product}
          selectedVariant={selectedVariant}
          quantity={quantity}
          disabled={isDisabled}
          theme='light'
          className='w-full min-w-0'
          buttonContainerClassName='h-14 min-h-14 border-none ring-0'
        />
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
      <KlarnaProductExpressCheckout
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        disabled={isDisabled}
        className='w-full min-w-0'
        buttonContainerClassName='h-14 min-h-14 border-none ring-0'
      />
      <QuickCheckoutButton
        isPending={isCheckoutPending}
        isDisabled={isDisabled}
        onClick={onCheckout}
        className='bg-primary text-foreground hover:bg-primary/90 [&_svg]:text-foreground'
      />
    </div>
  )
}
