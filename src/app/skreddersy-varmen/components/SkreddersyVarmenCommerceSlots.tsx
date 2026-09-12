import { Suspense } from 'react'
import { resolveSkreddersyVarmenCommerce } from '../data/resolveSkreddersyVarmenCommerce'
import { LandingCommerceUnavailable } from './LandingCommerceUnavailable'
import { LandingPurchaseFallback } from './LandingPurchaseFallback'
import { LandingPurchaseSection } from './LandingPurchaseSection'
import { StickyMobileAction } from './StickyMobileAction'
import type { LandingSearchParams } from './SkreddersyVarmenPageRuntime'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

function findDefaultCommerceVariant(
  commerce: ProductCommerceViewModel | null
) {
  return commerce?.variants.find(
    variant => variant.commerce.id === commerce.defaultVariantId
  )
}

async function StickyMobileActionWithCommerce() {
  const commerce = await resolveSkreddersyVarmenCommerce()
  const defaultVariant = findDefaultCommerceVariant(commerce)

  return (
    <StickyMobileAction
      {...(defaultVariant ?
        {
          price: defaultVariant.commerce.price,
          availableForSale: defaultVariant.commerce.availableForSale
        }
      : {})}
    />
  )
}

export function StickyMobileActionSlot() {
  return (
    <Suspense fallback={<StickyMobileAction />}>
      <StickyMobileActionWithCommerce />
    </Suspense>
  )
}

async function LandingPurchaseWithCommerce({
  searchParams
}: {
  searchParams?: LandingSearchParams
}) {
  const commerce = await resolveSkreddersyVarmenCommerce()

  return commerce ?
      <LandingPurchaseSection
        commerce={commerce}
        {...(searchParams ? { searchParams } : {})}
      />
    : <LandingCommerceUnavailable />
}

export function LandingPurchaseSlot({
  searchParams
}: {
  searchParams?: LandingSearchParams
}) {
  return (
    <Suspense fallback={<LandingPurchaseFallback />}>
      <LandingPurchaseWithCommerce
        {...(searchParams ? { searchParams } : {})}
      />
    </Suspense>
  )
}
