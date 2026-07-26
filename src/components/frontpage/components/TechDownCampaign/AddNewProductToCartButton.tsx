'use client'

import { Button } from '@/components/ui/button'
import { InlineText } from '@/components/typography/TypographyInlineText'

export const AddNewProductToCartButton = ({
  onAddToCartClick
}: {
  onAddToCartClick: () => void
}) => {
  return (
    <div className='w-full'>
      <Button
        type='button'
        onClick={onAddToCartClick}
        variant='checkout'
        className='group focus-visible:ring-offset-featured h-16 min-h-16 w-full rounded-full px-6 py-5 font-utekos-text font-utekos-text-medium text-lg tracking-[-0.01em] transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 md:h-14 md:min-h-14 md:py-4'
      >
        <InlineText>Legg i handlekurv</InlineText>
      </Button>
    </div>
  )
}
