// Path: src/components/ProductCard/ProductCard.tsx
'use client'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import { useCanonicalProductListVisibility } from '@/hooks/useCanonicalProductListVisibility'
import { formatPrice } from '@/lib/utils/formatPrice'
import { cn } from '@/lib/utils/className'
import type { ProductCardProps } from '@types'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type React from 'react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { findMatchingVariant } from './findMatchingVariant'
import { getInitialOptionsForProduct } from './getInitialOptionsForProduct'
import { ProductCardFooter } from './ProductCardFooter'
import { ProductCardHeader } from './ProductCardHeader'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import { ProductCardCompactVariantSelector } from './ProductCardCompactVariantSelector'
import { ProductColorSwatches } from './ProductColorSwatches'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { reportProductListSelectItem } from '@/lib/analytics/reportProductListSelectItem'
import { SoldOutWaitlistDialog } from '@/components/product-waitlist/SoldOutWaitlistDialog'

interface ExtendedProductCardProps extends ProductCardProps {
  isPriority?: boolean
  initialOptions?: Record<string, string>
  compactMobile?: boolean
  cardClassName?: string
  itemListName?: string
  itemListTotalCount?: number
}

export function ProductCard({
  product,
  colorHexMap,
  isPriority = false,
  initialOptions,
  compactMobile = false,
  cardClassName,
  itemListId = 'product_card',
  itemListName = 'Produktkort',
  itemListTotalCount = 1
}: ExtendedProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [selectedOptions, setSelectedOptions] = useState(
    () => initialOptions ?? getInitialOptionsForProduct(product)
  )
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)

  const { addToCart, isPending, isCartBusy } =
    useCanonicalAddToCart()

  const selectedVariant = findMatchingVariant(
    product,
    selectedOptions
  )

  useCanonicalProductListVisibility({
    elementRef: cardRef,
    itemListId,
    itemListName,
    product,
    totalItemCount: itemListTotalCount,
    variant: selectedVariant
  })

  const fallbackPrice = product.priceRange.minVariantPrice
  const fallbackImage = product.featuredImage

  const price = formatPrice(
    selectedVariant?.price ?? fallbackPrice
  )

  const baseUrl = `/produkter/${product.handle}`
  const variantQuery =
    selectedVariant ?
      `?variant=${encodeURIComponent(selectedVariant.id)}`
    : ''
  const productUrl = `${baseUrl}${variantQuery}` as Route
  const imageUrl =
    selectedVariant?.image?.url ??
    fallbackImage?.url ??
    '/placeholder.svg'
  const altText =
    selectedVariant?.image?.altText ??
    fallbackImage?.altText ??
    product.title
  const isAvailable = selectedVariant?.availableForSale ?? false
  const showWaitlistCta =
    product.handle === 'utekos-dun' && !isAvailable
  const imageSizes =
    compactMobile ?
      '(min-width: 1280px) 33vw, (min-width: 768px) 38vw, (min-width: 640px) 50vw, 72vw'
    : '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw'
  const productCardOptions = product.options.map(option => {
    const optionName = option.name.toLowerCase()
    const isColorOption =
      optionName === 'farge' || optionName === 'color'

    if (
      product.handle !== 'utekos-mikrofiber' ||
      !isColorOption
    ) {
      return option
    }

    return {
      ...option,
      optionValues: option.optionValues.filter(
        value =>
          value.name.toLocaleLowerCase('nb-NO') !== 'vargnatt'
      )
    }
  })
  const colorOption = productCardOptions.find(option => {
    const optionName = option.name.toLowerCase()

    return optionName === 'farge' || optionName === 'color'
  })

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedVariant) {
      toast.error('Vennligst velg en gyldig kombinasjon.')
      return
    }
    if (!isAvailable) {
      toast.warning('Denne varianten er dessverre utsolgt.')
      return
    }

    void (async () => {
      const { success } = await addToCart({
        product,
        variant: selectedVariant,
        quantity: 1,
        openCart: true
      })

      if (success) {
        toast.success(
          `${selectedVariant.title} er lagt i handlekurven!`
        )
      }
    })()
  }

  const handleViewProduct = () => {
    const destinationUrl =
      typeof window === 'undefined' ? productUrl : (
        new URL(productUrl, window.location.origin).toString()
      )

    reportProductListSelectItem({
      product,
      variant: selectedVariant,
      itemListId,
      destinationUrl
    })
  }

  const handleWaitlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWaitlistOpen(true)
  }

  const compactProductCardContent =
    compactMobile ?
      <div className='flex flex-col xl:hidden'>
        <CardContent className='relative overflow-hidden rounded-t-xl p-0'>
          <Link
            href={productUrl}
            data-track='ProductCardViewMoreClick'
            aria-label={`Se produkt ${product.title}`}
            onClick={handleViewProduct}
            className='dark:focus-visible:outline-dark-card-foreground block w-full rounded-t-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
          >
            <BrandBadge
              backgroundColor='var(--background)'
              textColor='var(--foreground)'
              className='dark:border-dark-foreground/12 absolute top-3 left-3 z-10 border border-foreground/12 px-2.5 py-1 text-[0.68rem] font-medium tracking-wide shadow-[0_12px_28px_-22px_rgba(32,28,54,0.58)]'
            >
              <InlineText>Unisex</InlineText>
            </BrandBadge>

            {product.handle === 'utekos-dun' ?
              <Badge
                variant='destructive'
                className='bg-disabled absolute top-3 right-3 z-10 border border-border px-2.5 py-1 text-[0.68rem] font-medium tracking-wide text-foreground uppercase'
              >
                <InlineText>Utsolgt</InlineText>
              </Badge>
            : null}

            <AspectRatio
              ratio={1 / 1}
              className='w-full overflow-hidden rounded-t-xl bg-jungle/90'
            >
              <Image
                src={imageUrl}
                alt={altText}
                fill
                quality={100}
                sizes={imageSizes}
                className='rounded-t-xl bg-jungle/90 object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]'
                fetchPriority={isPriority ? 'high' : 'low'}
                loading={isPriority ? 'eager' : 'lazy'}
              />
            </AspectRatio>
          </Link>
          <WishlistButton
            product={product}
            variant={selectedVariant}
            productTitle={product.title}
            returnTo={productUrl}
            className='absolute right-3 bottom-3 z-20 size-11 rounded-xl md:right-4 md:bottom-4 md:size-12 md:rounded-2xl'
          />
        </CardContent>

        <div className='dark:border-dark-card-foreground/24 flex flex-col gap-2 rounded-t-xl border-t border-card-foreground/24 bg-jungle p-3 pb-0 md:gap-3 md:p-4'>
          <div className='grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
            <Link
              href={productUrl}
              data-track='ProductCardViewMoreClick'
              title={product.title}
              onClick={handleViewProduct}
              className='dark:focus-visible:outline-dark-card-foreground min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
            >
              <h3 className='truncate font-utekos-text-medium text-base leading-6 tracking-tight text-card-foreground md:text-lg md:leading-7'>
                {product.title}
              </h3>
            </Link>
            {colorOption ?
              <ProductColorSwatches
                colorOption={colorOption}
                colorHexMap={colorHexMap}
                selectedOptions={selectedOptions}
                onOptionChange={setSelectedOptions}
                className='gap-1.5 justify-self-end'
                swatchClassName='!size-5 md:!size-7'
              />
            : null}
          </div>
          <InlineText className='font-google-sans text-sm leading-5 font-bold text-card-foreground md:text-lg md:leading-6'>
            {price}
          </InlineText>
          <ProductCardCompactVariantSelector
            options={productCardOptions}
            colorHexMap={colorHexMap}
            selectedOptions={selectedOptions}
            onOptionChange={setSelectedOptions}
          />
        </div>
      </div>
    : null

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group flex h-full flex-col gap-0 overflow-hidden border border-border bg-card p-0 text-card-foreground shadow-[0_18px_56px_-42px_rgba(8,10,24,0.85)]',
        cardClassName
      )}
    >
      {compactProductCardContent}
      <div
        className={
          compactMobile ? 'hidden xl:contents' : 'contents'
        }
      >
        <CardContent className='relative overflow-hidden rounded-t-xl p-0'>
          <Link
            href={productUrl}
            data-track='ProductCardViewMoreClick'
            aria-label={`Se produkt ${product.title}`}
            onClick={handleViewProduct}
            className='dark:focus-visible:outline-dark-card-foreground block w-full rounded-t-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
          >
            <BrandBadge
              backgroundColor='var(--background)'
              textColor='var(--foreground)'
              className={cn(
                'dark:border-dark-foreground/12 absolute top-4 left-4 z-10 border border-foreground/12 px-3 py-1 text-xs font-medium tracking-wide shadow-[0_12px_28px_-22px_rgba(32,28,54,0.58)]',
                compactMobile &&
                  'top-2 left-2 px-2 py-0.5 text-[0.65rem] md:top-4 md:left-4 md:px-3 md:py-1 md:text-xs'
              )}
            >
              <InlineText>Unisex</InlineText>
            </BrandBadge>

            {product.handle === 'utekos-dun' ?
              <Badge
                variant='destructive'
                className={cn(
                  'bg-disabled absolute top-4 right-4 z-10 border border-border px-3 py-1 text-xs font-medium tracking-wide text-foreground uppercase',
                  compactMobile &&
                    'top-2 right-2 px-2 py-0.5 text-[0.65rem] md:top-4 md:right-4 md:px-3 md:py-1 md:text-xs'
                )}
              >
                <InlineText>Utsolgt</InlineText>
              </Badge>
            : null}

            <AspectRatio
              ratio={1 / 1}
              className='w-full overflow-hidden rounded-t-xl bg-jungle/90'
            >
              <Image
                src={imageUrl}
                alt={altText}
                fill
                quality={100}
                sizes={imageSizes}
                className='rounded-t-xl bg-jungle/90 object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]'
                fetchPriority={isPriority ? 'high' : 'low'}
                loading={isPriority ? 'eager' : 'lazy'}
              />
            </AspectRatio>
          </Link>
          <WishlistButton
            product={product}
            variant={selectedVariant}
            productTitle={product.title}
            returnTo={productUrl}
            className={cn(
              'absolute right-4 bottom-10 z-20',
              compactMobile &&
                'right-2 bottom-8 size-10 rounded-xl md:right-4 md:bottom-10 md:size-12 md:rounded-2xl'
            )}
          />
        </CardContent>

        <ProductCardHeader
          title={product.title}
          options={productCardOptions}
          colorHexMap={colorHexMap}
          selectedOptions={selectedOptions}
          onOptionChange={setSelectedOptions}
          price={price}
          productUrl={productUrl}
          onViewProduct={handleViewProduct}
          compactMobile={compactMobile}
        />
      </div>
      <div
        className={cn(
          'mx-auto mt-auto flex w-full flex-col items-center gap-3 bg-jungle p-6 pt-4!',
          compactMobile &&
            'gap-2 p-3 max-md:pt-1! md:gap-3 md:p-4 md:pt-4! xl:p-6 xl:pt-4!'
        )}
      >
        <ProductCardFooter
          isAvailable={isAvailable}
          isPending={isPending}
          isDisabled={isPending || isCartBusy}
          onQuickBuy={handleQuickBuy}
          showWaitlistCta={showWaitlistCta}
          onWaitlistClick={handleWaitlistClick}
        />
        <KlarnaProductExpressCheckout
          product={product}
          selectedVariant={selectedVariant ?? null}
          disabled={isCartBusy}
          className='w-full'
          buttonContainerClassName='h-11! min-h-11! border-none ring-0 md:h-12! md:min-h-12!'
        />
      </div>
      {showWaitlistCta ?
        <SoldOutWaitlistDialog
          open={isWaitlistOpen}
          onOpenChange={setIsWaitlistOpen}
          autoOpenDelayMs={null}
          entryPoint='product_card'
        />
      : null}
    </Card>
  )
}
