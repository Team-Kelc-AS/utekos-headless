'use client'

import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import { Button } from '@/components/ui/button'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import { useCanonicalProductListVisibility } from '@/hooks/useCanonicalProductListVisibility'
import { Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import type { NbccProductCardActionsProps } from '../types'

export function NbccProductCardActions({
  product,
  cartProduct,
  variants,
  productTitle,
  totalItemCount
}: NbccProductCardActionsProps) {
  const actionsRef = useRef<HTMLDivElement>(null)
  const [selectedLabel, setSelectedLabel] = useState(
    variants.find(variant => variant.availableForSale)?.label ??
      variants[0]?.label ??
      ''
  )

  const { addToCart, isPending, isCartBusy } =
    useCanonicalAddToCart()

  const selectedVariant = variants.find(
    variant => variant.label === selectedLabel
  )
  const isAvailable = selectedVariant?.availableForSale ?? false
  const price =
    selectedVariant?.price ?? variants[0]?.price ?? ''
  const purchaseVariant = selectedVariant?.purchaseVariant
  const shopifyVariant = product.variants?.edges
    ?.map(edge => edge.node)
    .find(variant => variant.id === selectedVariant?.variantId)

  useCanonicalProductListVisibility({
    closestSelector: '[data-nbcc-product-card]',
    elementRef: actionsRef,
    itemListId: 'nbcc_products',
    itemListName: 'NBCC-produkter',
    product,
    totalItemCount,
    variant: shopifyVariant
  })

  const handleAddToCart = () => {
    if (!selectedVariant?.variantId || !purchaseVariant) {
      toast.error('Velg en størrelse først.')
      return
    }
    if (!isAvailable) {
      toast.warning('Denne størrelsen er dessverre utsolgt.')
      return
    }

    void (async () => {
      const { success } = await addToCart({
        product: cartProduct,
        variant: purchaseVariant,
        quantity: 1,
        openCart: true
      })

      if (success) {
        toast.success(
          `${productTitle} (${selectedVariant.label}) er lagt i handlekurven!`
        )
      }
    })()
  }

  if (variants.length === 0) {
    return (
      <p className='text-sm text-muted-foreground' role='status'>
        Størrelser er midlertidig utilgjengelige for dette
        produktet.
      </p>
    )
  }

  return (
    <div ref={actionsRef} className='flex flex-col gap-4'>
      <div>
        <p className='mb-2 text-xs font-medium tracking-widest text-foreground uppercase'>
          Størrelse
        </p>
        <div className='flex flex-wrap gap-2'>
          {variants.map(variant => (
            <button
              key={variant.label}
              type='button'
              onClick={() => setSelectedLabel(variant.label)}
              disabled={!variant.availableForSale}
              className={[
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-all',
                variant.label === selectedLabel ?
                  'border-background bg-foreground text-background'
                : !variant.availableForSale ?
                  'cursor-not-allowed border-foreground/10 text-foreground/25 line-through'
                : 'border-foreground/40 text-foreground/80 hover:border-foreground hover:text-foreground'
              ].join(' ')}
            >
              {variant.label}
            </button>
          ))}
        </div>
      </div>

      <div className='flex items-center justify-between gap-3'>
        <span className='font-utekos-text-medium text-xl text-foreground'>
          {price}
        </span>
        <span className='border-promo-foreground/20 bg-promo text-promo-foreground rounded-full border px-2 py-0.5 text-xs'>
          NBCC-rabatt i kassen
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        <Button
          onClick={handleAddToCart}
          disabled={
            isPending || isCartBusy || !isAvailable || !purchaseVariant
          }
          variant='checkout'
          className='h-11 w-full rounded-3xl bg-primary font-utekos-text-medium text-base text-foreground hover:bg-primary/90'
        >
          {isPending ?
            <Loader2 className='size-4 animate-spin' />
          : 'Legg i handlekurv'}
        </Button>
        {isAvailable && purchaseVariant ?
          <div className='flex h-11 min-h-11 w-full items-stretch'>
            <KlarnaProductExpressCheckout
              product={cartProduct}
              selectedVariant={purchaseVariant}
              quantity={1}
              disabled={isCartBusy}
              theme='default'
              className='h-full min-h-0 w-full min-w-0'
              buttonContainerClassName='h-full min-h-full md:h-full md:min-h-full'
            />
          </div>
        : null}
      </div>
    </div>
  )
}
