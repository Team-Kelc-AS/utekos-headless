'use client'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type ProductHeaderWishlistProps = {
  product: ProductCartModel
  variant: ProductPurchaseVariant
  productTitle: string
  returnTo: string
}

export function ProductHeaderWishlist({
  product,
  variant,
  productTitle,
  returnTo
}: ProductHeaderWishlistProps) {
  return (
    <div className='flex items-center gap-2'>
      <span
        aria-hidden='true'
        className='font-sans text-sm font-semibold leading-none text-foreground'
      >
        Ønskeliste
      </span>
      <HoverCard>
        <HoverCardTrigger
          delay={160}
          closeDelay={80}
          className='inline-flex shrink-0 cursor-pointer'
          render={<span />}
        >
          <WishlistButton
            product={product}
            variant={variant}
            productTitle={productTitle}
            returnTo={returnTo}
            surface='plain'
            className='size-11 cursor-pointer rounded-xl p-0 md:size-12'
          />
        </HoverCardTrigger>
        <HoverCardContent
          side='bottom'
          align='end'
          sideOffset={8}
          className='w-fit rounded-xl border border-foreground/12 bg-night px-3.5 py-2 font-sans font-semibold text-sm tracking-tight text-foreground shadow-[0_16px_36px_-22px_rgba(0,0,0,0.72)]'
        >
          Legg i ønskeliste?
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
