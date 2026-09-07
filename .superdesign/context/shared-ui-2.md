# Full source bundle for Superdesign

Complete selected UI sources, grouped only to respect the service file-count and 50,000-character per-file limits. No source content is removed. Refresh from listed files before reuse if their source hashes change.

## src/lib/utils/className.ts

```tsx
/**
 * @file src/lib/utils/className.ts
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { cva, type VariantProps } from 'class-variance-authority'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { cva, type VariantProps }
```

## src/components/ProductCard/SharedProductCarousel.tsx

```tsx
'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import { createColorHexMap } from '@/lib/helpers/shared/createColorHexMap'
import { cn } from '@/lib/utils/className'
import { initializeCarouselProducts } from './initializeCarouselProducts'
import { ProductCard } from './ProductCard'
import type { ShopifyProduct } from 'types/product'

interface SharedProductCarouselProps {
  products: ShopifyProduct[]
  navigationClassName?: string
  cardClassName?: string
  itemListId: string
  itemListName: string
}

export function SharedProductCarousel({
  products,
  navigationClassName,
  cardClassName,
  itemListId,
  itemListName
}: SharedProductCarouselProps) {
  if (products.length === 0) {
    return null
  }

  const productOptionsMap = initializeCarouselProducts(products)

  return (
    <Carousel
      slideCount={products.length}
      ssr={CAROUSEL_SSR.mobilePeekHalvesAndThirds(
        products.length
      )}
      opts={{ align: 'start', loop: products.length > 3 }}
      className='w-full'
    >
      <CarouselContent className='-ml-3 md:-ml-8 lg:-ml-10'>
        {products.map(product => {
          const colorHexMap = createColorHexMap(product)
          const initialOptions =
            productOptionsMap.get(product.handle) ??
            ({} as Record<string, string>)

          return (
            <CarouselItem
              key={product.id}
              className='basis-[72%] pl-3 sm:basis-1/2 md:basis-[38%] md:pl-8 lg:pl-10 xl:basis-1/3'
            >
              <ProductCard
                product={product}
                colorHexMap={colorHexMap}
                initialOptions={initialOptions}
                compactMobile
                itemListId={itemListId}
                itemListName={itemListName}
                itemListTotalCount={products.length}
                {...(cardClassName ? { cardClassName } : {})}
              />
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious
        forceVisible
        className={cn(
          'top-[34%] left-1.5 z-20 flex border-background bg-foreground text-background shadow-lg ring-1 ring-background/45 backdrop-blur-sm hover:bg-foreground/90 disabled:opacity-70 md:hidden [&_svg]:size-5'
        )}
      />
      <CarouselNext
        forceVisible
        className={cn(
          'top-[34%] right-1.5 z-20 flex border-background bg-foreground text-background shadow-lg ring-1 ring-background/45 backdrop-blur-sm hover:bg-foreground/90 disabled:opacity-70 md:hidden [&_svg]:size-5'
        )}
      />
      <CarouselPrevious
        className={cn(
          'max-md:hidden md:left-2 xl:-left-12',
          navigationClassName
        )}
      />
      <CarouselNext
        className={cn(
          'max-md:hidden md:right-2 xl:-right-12',
          navigationClassName
        )}
      />
    </Carousel>
  )
}
```

## src/components/ProductCard/ProductCard.tsx

```tsx
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
import { SizeLabel } from './SizeLabel'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { reportProductListSelectItem } from '@/lib/analytics/reportProductListSelectItem'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
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
      '(min-width: 1280px) 33vw, (min-width: 768px) 38vw, (min-width: 640px) 50vw, 86vw'
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
  const showCompactSizeGuide = productCardOptions.some(option => {
    const optionName = option.name.toLowerCase()

    return optionName === 'size' || optionName === 'størrelse'
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
    })().catch(error => {
      reportClientCaughtError(error, 'product_card.quick_buy')
      toast.error(
        'Beklager, produktet kunne ikke legges i handlekurven.'
      )
    })
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
      <div className='flex flex-col bg-night xl:hidden'>
        <CardContent className='relative overflow-hidden rounded-t-xl bg-night p-0'>
          <Link
            href={productUrl}
            data-track='ProductCardViewMoreClick'
            aria-label={`Se produkt ${product.title}`}
            onClick={handleViewProduct}
            className='block w-full rounded-t-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
          >
            <BrandBadge
              backgroundColor='var(--background)'
              textColor='var(--foreground)'
              className='absolute top-3 left-3 z-10 border border-foreground/12 px-2.5 py-1 text-[0.68rem] font-medium tracking-wide shadow-[0_12px_28px_-22px_rgba(32,28,54,0.58)]'
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
              className='w-full overflow-hidden rounded-t-xl bg-night'
            >
              <Image
                src={imageUrl}
                alt={altText}
                fill
                quality={100}
                sizes={imageSizes}
                className='rounded-t-xl bg-night object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]'
                fetchPriority={isPriority ? 'high' : 'low'}
                loading={isPriority ? 'eager' : 'lazy'}
              />
            </AspectRatio>
          </Link>
          {showCompactSizeGuide ?
            <SizeLabel
              label='Størrelsesguide'
              className='absolute bottom-3 left-2.5 z-20 min-h-0 gap-0.5 px-0 py-0 text-[0.62rem] leading-none font-medium tracking-normal text-foreground normal-case'
            />
          : null}

          <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-end px-2.5 pb-3'>
            <WishlistButton
              product={product}
              variant={selectedVariant}
              productTitle={product.title}
              returnTo={productUrl}
              className='pointer-events-auto size-9 rounded-lg p-0 shadow-none'
            />
          </div>
        </CardContent>

        <div className='relative z-10 mt-3 flex flex-col gap-2.5 bg-night px-3 pt-1 pb-0 md:gap-3 md:px-4'>
          <div className='grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2'>
            <Link
              href={productUrl}
              data-track='ProductCardViewMoreClick'
              title={product.title}
              onClick={handleViewProduct}
              className='min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
            >
              <h3 className='truncate font-utekos-text-medium text-base leading-6 tracking-tight text-card-foreground md:text-lg md:leading-7'>
                {product.title}
              </h3>
            </Link>
            <InlineText className='font-google-sans text-sm leading-none font-bold text-card-foreground md:text-lg'>
              {price}
            </InlineText>
          </div>
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
        cardClassName,
        compactMobile && 'max-xl:bg-night'
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
            className='block w-full rounded-t-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
          >
            <BrandBadge
              backgroundColor='var(--background)'
              textColor='var(--foreground)'
              className={cn(
                'absolute top-4 left-4 z-10 border border-foreground/12 px-3 py-1 text-xs font-medium tracking-wide shadow-[0_12px_28px_-22px_rgba(32,28,54,0.58)]',
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
            'gap-2 bg-night p-3 max-md:pt-3! md:gap-3 md:p-4 md:pt-4! xl:bg-jungle xl:p-6 xl:pt-4!'
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
          buttonContainerClassName='h-10! min-h-10! border-none ring-0 md:h-12! md:min-h-12!'
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
```

## src/components/ProductCard/ProductCardHeader.tsx

```tsx
import { CardHeader, CardTitle } from '@/components/ui/card'
import type { ProductCardHeaderProps } from '@types'
import { cn } from '@/lib/utils/className'
import Link from 'next/link'
import { ProductColorSwatches } from './ProductColorSwatches'
import { ProductVariantSelector } from './ProductVariantSelector'
import { H3 } from '@/components/typography/TypographyH3'
import { InlineText } from '@/components/typography/TypographyInlineText'

type ProductCardHeaderViewProps = ProductCardHeaderProps & {
  compactMobile?: boolean
}

export function ProductCardHeader({
  title,
  options,
  colorHexMap,
  selectedOptions,
  onOptionChange,
  price,
  productUrl,
  onViewProduct,
  compactMobile = false
}: ProductCardHeaderViewProps) {
  const colorOption = options.find(option => {
    const optionName = option.name.toLowerCase()

    return optionName === 'farge' || optionName === 'color'
  })
  const optionsWithoutColor = options.filter(option => {
    const optionName = option.name.toLowerCase()

    return optionName !== 'farge' && optionName !== 'color'
  })
  const productViewClickProps =
    onViewProduct ? { onClick: onViewProduct } : {}

  return (
    <CardHeader
      className={cn(
        'relative z-10 -mt-6 flex grow flex-col gap-3 rounded-t-3xl border-t border-border bg-jungle p-6 pb-4',
        compactMobile && 'p-2 pb-2 md:p-6 md:pb-4'
      )}
    >
      <div
        className={cn(
          'grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-4',
          compactMobile && 'gap-1.5 md:gap-4'
        )}
      >
        <Link
          href={productUrl}
          {...productViewClickProps}
          title={title}
          className={cn(
            'w-full min-w-0 rounded-sm font-utekos-text-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground'
          )}
        >
          <CardTitle
            className={cn(
              'text-card-foreground',
              compactMobile && 'text-card-foreground'
            )}
          >
            <H3
              className={cn(
                'truncate pb-0 font-sans text-xl leading-8 font-bold text-card-foreground',
                compactMobile &&
                  'text-[0.82rem] leading-5 md:text-xl md:leading-8'
              )}
            >
              {title}
            </H3>
          </CardTitle>
        </Link>

        {colorOption && (
          <ProductColorSwatches
            colorOption={colorOption}
            colorHexMap={colorHexMap}
            selectedOptions={selectedOptions}
            onOptionChange={onOptionChange}
            {...(compactMobile ?
              {
                className: 'justify-self-end gap-1 md:gap-2',
                swatchClassName: '!size-5 md:!size-8'
              }
            : { className: 'justify-self-end' })}
          />
        )}
      </div>
      <InlineText
        className={cn(
          'font-sans text-2xl leading-none font-semibold text-card-foreground',
          compactMobile && 'text-base md:text-2xl'
        )}
      >
        {price}
      </InlineText>
      <ProductVariantSelector
        options={optionsWithoutColor}
        colorHexMap={colorHexMap}
        selectedOptions={selectedOptions}
        onOptionChange={onOptionChange}
        compactMobile={compactMobile}
      />
    </CardHeader>
  )
}
```

## src/components/ProductCard/ProductCardFooter.tsx

```tsx
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
```

