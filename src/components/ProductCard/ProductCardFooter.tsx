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
  onQuickBuy
}: ProductCardFooterProps) {
  const handleQuickBuyClick = (e: React.MouseEvent) => {
    onQuickBuy(e)
  }

  const actionButtonClassName =
    'font-utekos-text-medium h-12 min-h-12 min-w-0 w-full max-w-full overflow-hidden rounded-full px-4 py-0 text-center text-base leading-tight whitespace-normal ring-1 ring-card-foreground/50 ring-inset motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2'
  return (
    <CardFooter className='flex w-full flex-col p-0'>
      <div className='grid w-full min-w-0'>
        {isAvailable ?
          <Button
            type='button'
            onClick={handleQuickBuyClick}
            data-track='ProductCardFooterAddToCartClick'
            disabled={isPending}
            variant='checkout'
            className={`${actionButtonClassName} focus-visible:outline-commerce-primary-foreground focus-visible:outline-dark-commerce-primary-foreground disabled:opacity-70`}
          >
            {isPending ?
              <Loader2 className='size-4 animate-spin' />
            : <InlineText>Legg i handlekurv</InlineText>}
          </Button>
        : <ProductCardSoldOut />}
      </div>
    </CardFooter>
  )
}
