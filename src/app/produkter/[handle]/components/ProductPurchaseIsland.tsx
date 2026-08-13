'use client'

import { Activity } from 'react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { AddToCart } from '@/components/cart/AddToCart'
import { TrustSignals } from './TrustSignals'
import { renderOptionComponent } from '../utils/renderOptionComponent'
import { getSortedOptions } from '@/lib/helpers/async/getSortedOptions'
import { createSwatchColorMap } from '@/hooks/createSwatchColorMap'
import { useVariantSelection } from '@/hooks/useVariantSelection'
import type { UtekosProductOptions } from '@/lib/shopify/product-options/types'
import type { ProductPurchaseModel } from 'types/product/ProductPurchaseModel'

type ProductPurchaseIslandProps = {
  product: ProductPurchaseModel
  productOptions: UtekosProductOptions
  hasVariantSelectionError: boolean
}

export function ProductPurchaseIsland({
  product,
  productOptions,
  hasVariantSelectionError
}: ProductPurchaseIslandProps) {
  const {
    allVariants,
    selectedVariant,
    updateVariant,
    isVariantNavigationPending
  } = useVariantSelection({ product, productOptions })

  if (!selectedVariant) return null

  const sortedProductOptions = getSortedOptions(
    product.options,
    ['Størrelse', 'Farge']
  )
  const colorHexMap = createSwatchColorMap(product)

  return (
    <AnimatedBlock
      className='will-animate-fade-in-right'
      delay='0.16s'
    >
      <article
        aria-labelledby='product-options'
        aria-busy={isVariantNavigationPending}
      >
        <h2 id='product-options' className='sr-only'>
          Produktvalg
        </h2>
        <div className='mt-5 flex flex-col gap-8'>
          {sortedProductOptions.map(productOption =>
            renderOptionComponent({
              option: productOption,
              allVariants,
              selectedVariant,
              onOptionChange: updateVariant,
              colorHexMap,
              productHandle: product.handle,
              productOptions,
              isVariantNavigationPending,
              hasVariantSelectionError
            })
          )}
        </div>
        <div
          className='mt-3 min-h-5 text-sm text-foreground/72'
          role={hasVariantSelectionError ? 'alert' : 'status'}
          aria-live='polite'
        >
          {hasVariantSelectionError ?
            'Variantvalg er midlertidig utilgjengelig. Oppdater siden for å prøve igjen.'
          : isVariantNavigationPending ?
            'Oppdaterer variant…'
          : null}
        </div>
        <TrustSignals />
        <div className='mt-8 flex flex-col gap-4'>
          <Activity>
            <AddToCart
              product={product}
              selectedVariant={selectedVariant}
              isSelectionPending={
                isVariantNavigationPending ||
                hasVariantSelectionError
              }
              showAddToCartAction={false}
            />
          </Activity>
        </div>
      </article>
    </AnimatedBlock>
  )
}
