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
  variants,
  productTitle,
  totalItemCount
}: NbccProductCardActionsProps) {
  const actionsRef = useRef<HTMLDivElement>(null)
  const [selectedLabel, setSelectedLabel] = useState(
    variants[0]?.label ?? ''
  )

  const { addToCart, isPending } = useCanonicalAddToCart()

  const selectedVariant = variants.find(
    v => v.label === selectedLabel
  )
  const isAvailable = selectedVariant?.availableForSale ?? false
  const price =
    selectedVariant?.price ?? variants[0]?.price ?? ''
  const shopifyVariant = product.variants.edges
    .map(edge => edge.node)
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
    if (!selectedVariant?.variantId) {
      toast.error('Velg en størrelse først.')
      return
    }
    if (!isAvailable) {
      toast.warning('Denne størrelsen er dessverre utsolgt.')
      return
    }

    if (!shopifyVariant) {
      toast.error('Kunne ikke finne valgt variant. Prøv igjen.')
      return
    }

    void (async () => {
      const { success } = await addToCart({
        product,
        variant: shopifyVariant,
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

  return (
    <div ref={actionsRef} className='flex flex-col gap-4'>
      <div>
        <p className='mb-2 text-xs font-medium tracking-widest text-foreground uppercase'>
          Størrelse
        </p>
        <div className='flex flex-wrap gap-2'>
          {variants.map(v => (
            <button
              key={v.label}
              type='button'
              onClick={() => setSelectedLabel(v.label)}
              disabled={!v.availableForSale}
              className={[
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-all',
                v.label === selectedLabel ?
                  'dark:border-dark-background dark:bg-dark-foreground dark:text-dark-background border-background bg-foreground text-background'
                : !v.availableForSale ?
                  'dark:border-dark-foreground/10 /25 cursor-not-allowed border-foreground/10 text-foreground/25 line-through'
                : 'dark:border-dark-foreground/40 /80 dark:hover:border-dark-foreground dark:hover:text-dark-foreground border-foreground/40 text-foreground/80 hover:border-foreground hover:text-foreground'
              ].join(' ')}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <span className='font-utekos-text-medium text-xl text-foreground'>
          {price}
        </span>
        <span className='border-promo-foreground/20 dark:border-dark-promo-foreground/20 bg-promo dark:bg-dark-promo text-promo-foreground dark:text-dark-promo-foreground rounded-full border px-2 py-0.5 text-xs'>
          NBCC-rabatt i kassen
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        <Button
          onClick={handleAddToCart}
          disabled={isPending || !isAvailable}
          variant='commerce-primary'
          className='h-11 w-full rounded-md'
        >
          {isPending ?
            <Loader2 className='size-4 animate-spin' />
          : 'Legg i handlekurv'}
        </Button>
        {isAvailable && shopifyVariant ?
          <div className='flex h-11 min-h-11 w-full items-stretch'>
            <KlarnaProductExpressCheckout
              product={product}
              selectedVariant={shopifyVariant}
              quantity={1}
              disabled={isPending}
              theme='light'
              className='h-full min-h-0 w-full min-w-0'
              buttonContainerClassName='h-full min-h-full md:h-full md:min-h-full'
            />
          </div>
        : null}
      </div>
    </div>
  )
}
