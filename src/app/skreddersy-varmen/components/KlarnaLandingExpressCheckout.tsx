'use client'

import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import { cn } from '@/lib/utils/className'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type KlarnaLandingExpressCheckoutProps = {
  product: ProductCartModel | null
  selectedVariant: ProductPurchaseVariant | null
  quantity: number
  className?: string
}

const klarnaButtonContainerClassName =
  'h-14 min-h-14 md:h-14 md:min-h-14 ring-card-foreground/50'

export function KlarnaLandingExpressCheckout({
  product,
  selectedVariant,
  quantity,
  className
}: KlarnaLandingExpressCheckoutProps) {
  if (!product || !selectedVariant) {
    return null
  }

  return (
    <div
      role='group'
      className={cn(
        'flex w-full min-w-0 flex-col gap-3 min-[900px]:gap-4',
        className
      )}
      aria-label='Klarna express checkout'
    >
      <KlarnaProductExpressCheckout
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        className='w-full min-w-0'
        buttonContainerClassName={klarnaButtonContainerClassName}
      />
    </div>
  )
}
