'use client'
// Path: src/components/ProductCard/ProductCardFooter.tsx
import { CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { ProductCardFooterProps } from '@types'
import type React from 'react'
import { ProductCardSoldOut } from './ProductCardSoldOut'
import { InlineText } from '@/components/typography/TypographyInlineText'

export function ProductCardFooter({
  isAvailable,
  isPending,
  isDisabled,
  onQuickBuy,
  showWaitlistCta = false,
  onWaitlistClick
}: ProductCardFooterProps) {
  const handleQuickBuyClick = (e: React.MouseEvent) => {
    onQuickBuy(e)
  }

  const handleWaitlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onWaitlistClick?.(e)
  }

  const actionButtonClassName =
    'h-10 min-h-10 min-w-0 w-full max-w-full touch-manipulation overflow-hidden rounded-full border-none px-3 py-0 text-center font-sans text-sm leading-tight font-semibold whitespace-normal text-foreground ring-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 md:h-12 md:min-h-12 md:px-4 md:text-base'
  return (
    <CardFooter className='flex w-full flex-col p-0'>
      <div className='flex w-full min-w-0 flex-col gap-2'>
        {isAvailable ?
          <Button
            type='button'
            onClick={handleQuickBuyClick}
            data-track='ProductCardFooterAddToCartClick'
            disabled={isDisabled}
            variant='checkout'
            className={`${actionButtonClassName} bg-primary disabled:opacity-70`}
          >
            {isPending ?
              <Loader2 className='size-4 motion-safe:animate-spin' />
            : <InlineText className='font-sans font-semibold'>
                Legg i handlekurv
              </InlineText>
            }
          </Button>
        : showWaitlistCta ?
          <>
            <Button
              type='button'
              onClick={handleWaitlistClick}
              data-track='ProductCardWaitlistClick'
              variant='checkout'
              className={`${actionButtonClassName} bg-primary`}
            >
              <InlineText className='font-sans font-semibold'>
                Meld på venteliste
              </InlineText>
            </Button>
            <Button
              type='button'
              disabled
              variant='checkout'
              className={`${actionButtonClassName} bg-night hover:translate-y-0 hover:scale-100 hover:opacity-100 disabled:opacity-100`}
            >
              <InlineText className='font-sans font-semibold'>
                Utsolgt
              </InlineText>
            </Button>
          </>
        : <ProductCardSoldOut />}
      </div>
    </CardFooter>
  )
}
