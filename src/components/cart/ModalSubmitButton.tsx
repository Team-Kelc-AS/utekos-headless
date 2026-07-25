'use client'

import { SoldOutButton } from './SoldOutButton'
import { QuickCheckoutButton } from './QuickCheckoutButton'
import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'
import type { CheckoutPresentation } from 'types/cart'

interface ModalSubmitButtonProps {
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant | null
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
          className='bg-[oklch(0.78_0.15_67)] text-[#001212] hover:bg-[oklch(0.73_0.15_67)] dark:bg-[oklch(0.78_0.15_67)] dark:text-[#001212] dark:hover:bg-[oklch(0.73_0.15_67)] [&_svg]:text-[#001212]'
        />
        <div className='flex items-center gap-3 text-xs text-foreground/60'>
          <span className='h-px flex-1 bg-border' aria-hidden />
          <span>Eller betal direkte med Klarna</span>
          <span className='h-px flex-1 bg-border' aria-hidden />
        </div>
        <KlarnaProductExpressCheckout
          product={product}
          selectedVariant={selectedVariant}
          quantity={quantity}
          className='w-full min-w-0'
          buttonContainerClassName='h-14 min-h-14'
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
        className='w-full min-w-0'
        buttonContainerClassName='h-14 min-h-14'
      />
      <QuickCheckoutButton
        isPending={isCheckoutPending}
        isDisabled={isDisabled}
        onClick={onCheckout}
      />
    </div>
  )
}
