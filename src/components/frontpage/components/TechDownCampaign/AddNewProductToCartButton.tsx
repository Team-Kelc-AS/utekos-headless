'use client'

import { Button } from '@/components/ui/button'
import { InlineText } from '@/components/typography/TypographyInlineText'
import {
  featuredCheckoutButtonFillClassName,
  featuredCheckoutButtonShellClassName
} from './featuredCheckoutButtonHeight'
import { cn } from '@/lib/utils/className'

export const AddNewProductToCartButton = ({
  onAddToCartClick
}: {
  onAddToCartClick: () => void
}) => {
  return (
    <div className={featuredCheckoutButtonShellClassName}>
      <Button
        type='button'
        onClick={onAddToCartClick}
        variant='checkout'
        className={cn(
          'group focus-visible:ring-offset-featured rounded-full px-6 py-0 font-utekos-text-medium text-lg tracking-[-0.01em] transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2',
          featuredCheckoutButtonFillClassName
        )}
      >
        <InlineText className='font-utekos-text-medium'>
          Legg i handlekurv
        </InlineText>
      </Button>
    </div>
  )
}
