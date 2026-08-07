import { WishlistButton } from '@/components/wishlist/WishlistButton'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export interface ProductHeaderProps {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant
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
      <div className='min-w-0 flex-1'>
        <hgroup>
          <h1 className='font-sans mx-0 text-left text-4xl font-bold text-foreground'>
            {productTitle}
          </h1>

          {typeof productSubtitle === 'string' &&
            productSubtitle.trim() !== '' && (
              <p className='leading-text-paragraph mt-4 max-w-2xl text-lg text-foreground'>
                {productSubtitle}
              </p>
            )}
        </hgroup>
      </div>

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