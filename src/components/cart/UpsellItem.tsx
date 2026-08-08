'use client'

import { getInitialAvailableOptions } from '@/components/ProductCard/getInitialAvailableOptions'
import { findMatchingVariant } from '@/components/ProductCard/findMatchingVariant'
import { Button } from '@/components/ui/button'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import { cn } from '@/lib/utils/className'
import { formatPrice } from '@/lib/utils/formatPrice'
import type { UpsellItemProps } from 'types/cart'
import { ArrowRightIcon, PercentIcon } from 'lucide-react'
import Image from 'next/image'

export function UpsellItem({
  product,
  showDiscountHint
}: UpsellItemProps) {
  const { addToCart, isPending, isCartBusy } =
    useCanonicalAddToCart()

  const selectedOptions = getInitialAvailableOptions(product)
  const selectedVariant = findMatchingVariant(
    product,
    selectedOptions
  )

  const originalPrice = parseFloat(
    product.priceRange.minVariantPrice.amount
  )
  const discountedPrice = originalPrice * 0.9

  const handleAddToCart = () => {
    if (!selectedVariant) return

    void addToCart({
      product,
      variant: selectedVariant,
      quantity: 1,
      openCart: false
    })
  }

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 rounded-lg border p-3',
        showDiscountHint ?
          'border-secondary/30 bg-secondary/10 ring-1 ring-secondary/20 ring-inset'
        : 'border-border bg-muted/50'
      )}
    >
      <div className='flex items-start gap-3'>
        <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted'>
          {product.featuredImage && (
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              className='object-cover'
              sizes='48px'
            />
          )}
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0 flex-1'>
            <p className='line-clamp-2 text-sm font-medium text-foreground'>
              {product.title}
            </p>
            <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
              {showDiscountHint ?
                <>
                  <span className='line-through'>
                    {formatPrice(
                      product.priceRange.minVariantPrice
                    )}
                  </span>
                  <span className='font-google-sans font-bold text-foreground'>
                    {formatPrice({
                      amount: discountedPrice.toString(),
                      currencyCode: 'NOK'
                    })}
                  </span>
                </>
              : <span className='font-google-sans font-bold text-foreground'>
                  {formatPrice(
                    product.priceRange.minVariantPrice
                  )}
                </span>
              }
            </div>
          </div>

          <Button
            size='sm'
            variant='secondary'
            onClick={handleAddToCart}
            disabled={!selectedVariant || isPending || isCartBusy}
            className='w-full sm:w-auto sm:shrink-0'
          >
            Legg til <ArrowRightIcon className='ml-2 h-4 w-4' />
          </Button>
        </div>
      </div>

      {showDiscountHint && (
        <div className='flex items-center justify-center border-t border-secondary/20 pt-2 font-utekos-text-medium text-xs text-secondary'>
          <PercentIcon
            className='mr-1.5 h-3 w-3'
            aria-hidden='true'
          />
          Du får 10% rabatt på dette produktet!
        </div>
      )}
    </div>
  )
}
