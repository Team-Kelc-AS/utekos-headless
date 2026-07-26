import { AnimatedBlock } from '@/components/AnimatedBlock'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { Sparkles } from 'lucide-react'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

export interface ProductHeaderProps {
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant
  productHandle: string
  productTitle: string
  productSubtitle: string
}

export default function ProductHeader({
  product,
  selectedVariant,
  productHandle,
  productTitle,
  productSubtitle
}: ProductHeaderProps) {
  return (
    <div className='flex items-start justify-between gap-4 text-left text-foreground md:mb-6'>
      <AnimatedBlock
        className='will-animate-fade-in-up min-w-0 flex-1'
        delay='0.06s'
        threshold={0.2}
      >
        <hgroup>
          {productHandle === 'utekos-special-edition' && (
            <BrandBadge
              backgroundColor='bg-card '
              textColor='text-foreground '
              className='mb-5 gap-2'
            >
              <Sparkles className='h-5 w-5' aria-hidden='true' />
              <span className='text-foreground'>
                Begrenset opplag
              </span>
            </BrandBadge>
          )}

          <h1 className='font-google-sans mx-0 text-left font-sans text-4xl font-bold text-foreground'>
            {productTitle}
          </h1>

          {typeof productSubtitle === 'string' &&
            productSubtitle.trim() !== '' && (
              <p className='leading-text-paragraph mt-4 max-w-2xl text-lg text-foreground'>
                {productSubtitle}
              </p>
            )}
        </hgroup>
      </AnimatedBlock>
      <WishlistButton
        product={product}
        variant={selectedVariant}
        productTitle={productTitle}
        returnTo={`/produkter/${productHandle}`}
        buttonVariant='labelled'
        className='mt-1 shrink-0'
      />
    </div>
  )
}
