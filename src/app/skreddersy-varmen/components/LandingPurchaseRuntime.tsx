'use client'

import { useEffect } from 'react'
import { CartProviderLoader } from '@/components/providers/CartProviderLoader'
import { Cart } from '@/components/cart/Cart'
import { cartStore } from '@/lib/state/cartStore'
import { PurchaseClientLanding } from './PurchaseClientLanding'
import { LandingPageProductCarouselPurchaseSection } from './LandingPageProductCarouselPurchaseSection'
import { LandingPurchaseProductInformation } from './LandingPurchaseProductInformation'
import { ProductDetailsAccordion } from './ProductDetailsAccordion'
import { TechDownSizeGuideAccordion } from './TechDownSizeGuideAccordion'
import type { ProductModel } from '@/lib/products/commerce'
import type { ProductPresentation } from '@/lib/products/presentation/getProductPresentation'

export default function LandingPurchaseRuntime({
  cartRequest,
  ...props
}: {
  cartRequest: number
  commerce: ProductModel
  initialVariantId: string
  presentation: ProductPresentation
}) {
  useEffect(() => {
    if (cartRequest > 0) cartStore.send({ type: 'OPEN' })
  }, [cartRequest])
  return (
    <CartProviderLoader>
      <Cart className='hidden' />
      <PurchaseClientLanding
        {...props}
        content={{
          gallery: <LandingPageProductCarouselPurchaseSection />,
          productInformation: (
            <LandingPurchaseProductInformation
              modelName={props.commerce.title.replace(
                /^Utekos\s+/u,
                ''
              )}
            />
          ),
          sizeGuide: <TechDownSizeGuideAccordion />,
          productDetails: (
            <ProductDetailsAccordion selectedModel='utekos-techdown' />
          )
        }}
      />
    </CartProviderLoader>
  )
}
