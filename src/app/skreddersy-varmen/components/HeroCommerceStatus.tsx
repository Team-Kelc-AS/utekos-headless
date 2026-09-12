import { Suspense } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'
import { resolveSkreddersyVarmenCommerce } from '../data/resolveSkreddersyVarmenCommerce'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

function findDefaultCommerceVariant(
  commerce: ProductCommerceViewModel | null
) {
  return commerce?.variants.find(
    variant => variant.commerce.id === commerce.defaultVariantId
  )
}

async function HeroCommerceStatus() {
  const commerce = await resolveSkreddersyVarmenCommerce()
  const defaultVariant = findDefaultCommerceVariant(commerce)

  if (!defaultVariant) return null

  return (
    <div className='mt-5 space-y-3'>
      <p
        className='leading-text-paragraph flex w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs font-medium tracking-normal text-foreground/80 md:text-sm'
        aria-live='polite'
      >
        <span>{formatPrice(defaultVariant.commerce.price)}</span>
        <span aria-hidden>·</span>
        <span>
          {defaultVariant.commerce.availableForSale ?
            'På lager'
          : 'Utsolgt'}
        </span>
        <span aria-hidden>·</span>
        <span>Rask levering</span>
      </p>
    </div>
  )
}

export function HeroCommerceStatusSlot() {
  return (
    <Suspense fallback={null}>
      <HeroCommerceStatus />
    </Suspense>
  )
}
