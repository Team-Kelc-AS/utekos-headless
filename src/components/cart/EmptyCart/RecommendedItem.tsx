'use client'

import { getInitialAvailableOptions } from '@/components/ProductCard/getInitialAvailableOptions'
import { findMatchingVariant } from '@/components/ProductCard/findMatchingVariant'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import { useCanonicalProductListVisibility } from '@/hooks/useCanonicalProductListVisibility'
import { reportProductListSelectItem } from '@/lib/analytics/reportProductListSelectItem'
import { cartStore } from '@/lib/state/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import type { ShopifyProduct } from 'types/product'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

export function RecommendedItem({
  product,
  totalItemCount
}: {
  product: ShopifyProduct
  totalItemCount: number
}) {
  const itemRef = useRef<HTMLDivElement>(null)
  const { addToCart, isPending, isCartBusy } =
    useCanonicalAddToCart()
  const selectedOptions = getInitialAvailableOptions(product)
  const selectedVariant = findMatchingVariant(
    product,
    selectedOptions
  )

  useCanonicalProductListVisibility({
    elementRef: itemRef,
    itemListId: 'cart_recommended',
    itemListName: 'Anbefalt i tom handlekurv',
    product,
    totalItemCount,
    variant: selectedVariant
  })

  const handleAddToCart = () => {
    if (!selectedVariant) return

    void addToCart({
      product,
      variant: selectedVariant,
      quantity: 1,
      openCart: false
    })
  }

  const productUrl = `/produkter/${product.handle}` as Route

  const handleViewProduct = () => {
    const destinationUrl =
      typeof window === 'undefined' ?
        productUrl
      : new URL(productUrl, window.location.origin).toString()

    reportProductListSelectItem({
      product,
      variant: selectedVariant,
      itemListId: 'cart_recommended',
      destinationUrl
    })
    cartStore.send({ type: 'CLOSE' })
  }

  return (
    <div ref={itemRef} className='flex items-center gap-4'>
      <Link
        href={productUrl}
        data-track='CartRecommendedItemClick'
        onClick={handleViewProduct}
      >
        <div className='w-16 shrink-0'>
          <AspectRatio
            ratio={2 / 3}
            className='overflow-hidden rounded-md border border-border bg-muted'
          >
            {product.featuredImage && (
              <Image
                src={product.featuredImage.url}
                alt={
                  product.featuredImage.altText || product.title
                }
                fill
                className='object-cover'
                sizes='64px'
              />
            )}
          </AspectRatio>
        </div>
      </Link>
      <div className='grow'>
        <Link
          href={productUrl}
          data-track='CartRecommendedItemClick'
          onClick={handleViewProduct}
        >
          <h4 className='text-sm font-medium text-foreground hover:underline'>
            {product.title}
          </h4>
        </Link>
        <p className='mt-1 text-sm text-muted-foreground'>
          {formatPrice(product.priceRange.minVariantPrice)}
        </p>
      </div>
      <Button
        size='sm'
        variant='secondary'
        onClick={handleAddToCart}
        disabled={!selectedVariant || isPending || isCartBusy}
      >
        Legg til
      </Button>
    </div>
  )
}
