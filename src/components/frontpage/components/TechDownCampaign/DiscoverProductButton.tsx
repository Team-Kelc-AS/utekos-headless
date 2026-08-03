'use client'

import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import { cn } from '@/lib/utils/className'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'
import {
  featuredCheckoutButtonFillClassName,
  featuredCheckoutButtonShellClassName
} from './featuredCheckoutButtonHeight'

const DiscoverProductButtons = ({
  product,
  selectedVariant
}: {
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant | null
}) => {
  return (
    <div
      className={featuredCheckoutButtonShellClassName}
      aria-label='Klarna express checkout'
    >
      <KlarnaProductExpressCheckout
        product={product}
        selectedVariant={selectedVariant}
        quantity={1}
        className='flex h-full min-h-0 max-h-full w-full min-w-0 items-stretch'
        buttonContainerClassName={cn(
          featuredCheckoutButtonFillClassName,
          'border-none ring-0'
        )}
      />
    </div>
  )
}

export default DiscoverProductButtons
