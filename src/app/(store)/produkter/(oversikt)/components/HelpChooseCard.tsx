'use client'

import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { useAddToCartAction } from '@/hooks/useAddToCartAction'
import { useCanonicalProductListVisibility } from '@/hooks/useCanonicalProductListVisibility'
import { reportProductListSelectItem } from '@/lib/analytics/reportProductListSelectItem'
import { cn } from '@/lib/utils/className'
import { flattenConnection } from '@shopify/hydrogen-react/flatten-connection'
import { Loader2, ShoppingBag } from 'lucide-react'
import { motion } from 'motion/react'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'
import styles from './HelpChooseCard.module.css'

interface HelpChooseCardProps {
  product: ShopifyProduct
  displayTitle: string
  imageSrc: string
  sizeLabel: string
  index: number
  glowColor: string
  totalItemCount: number
}

type ProductVariantsShape =
  | ShopifyProductVariant[]
  | {
      nodes?: ShopifyProductVariant[]
      edges?: Array<{ node: ShopifyProductVariant }>
    }

function normalizeVariants(
  product: ShopifyProduct
): ShopifyProductVariant[] {
  const variants = product.variants as ProductVariantsShape
  if (Array.isArray(variants)) return variants
  if (variants?.nodes) {
    return flattenConnection({ nodes: variants.nodes })
  }
  if (variants?.edges) {
    return flattenConnection({ edges: variants.edges })
  }
  return []
}

function getOptionValue(
  variant: ShopifyProductVariant,
  optionNames: readonly string[]
) {
  return variant.selectedOptions.find(option =>
    optionNames.includes(option.name)
  )?.value
}

function findCardVariant(
  variants: ShopifyProductVariant[],
  sizeLabel: string
) {
  const preferredColor = variants
    .filter(variant => variant.availableForSale)
    .map(variant => getOptionValue(variant, ['Color', 'Farge']))
    .find(Boolean)

  return (
    variants.find(
      variant =>
        getOptionValue(variant, ['Size', 'Størrelse']) ===
          sizeLabel &&
        (!preferredColor ||
          getOptionValue(variant, ['Color', 'Farge']) ===
            preferredColor)
    ) ??
    variants.find(
      variant =>
        getOptionValue(variant, ['Size', 'Størrelse']) ===
        sizeLabel
    ) ??
    null
  )
}

export function HelpChooseCard({
  product,
  displayTitle,
  imageSrc,
  sizeLabel,
  index,
  glowColor,
  totalItemCount
}: HelpChooseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const variants = normalizeVariants(product)
  const selectedVariant = findCardVariant(variants, sizeLabel)
  const isAvailable = selectedVariant?.availableForSale === true
  const variantQuery =
    selectedVariant ?
      `?variant=${encodeURIComponent(selectedVariant.id)}`
    : ''
  const productUrl =
    `/produkter/${product.handle}${variantQuery}` as Route
  const price =
    selectedVariant?.price.amount ??
    product.priceRange.minVariantPrice.amount
  const formattedPrice = `${Number(price).toLocaleString(
    'no-NO',
    { maximumFractionDigits: 0 }
  )} kr`

  const { performAddToCart, isPending } = useAddToCartAction({
    product,
    selectedVariant
  })

  useCanonicalProductListVisibility({
    elementRef: cardRef,
    itemListId: 'help_choose_carousel',
    itemListName: 'Hjelp meg å velge',
    product,
    totalItemCount,
    variant: selectedVariant
  })

  const handleViewProduct = () => {
    const destinationUrl =
      typeof window === 'undefined' ? productUrl : (
        new URL(productUrl, window.location.origin).toString()
      )

    reportProductListSelectItem({
      product,
      variant: selectedVariant,
      itemListId: 'help_choose_carousel',
      destinationUrl
    })
  }

  const handleAddToCart = () => {
    if (!selectedVariant || !isAvailable || isPending) return
    void performAddToCart(1, selectedVariant)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: 'easeOut'
      }}
      className='group relative size-full'
    >
      <div
        className={cn(
          'relative flex aspect-2/3 h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-card shadow-2xl transition-transform duration-300 md:hover:-translate-y-1',
          styles.brandFontVariant
        )}
      >
        <Link
          href={productUrl}
          aria-label={`Se ${displayTitle}`}
          className='absolute inset-0 z-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          data-track='HelpChooseCardViewMoreClick'
          onClick={handleViewProduct}
        >
          <Image
            src={imageSrc}
            alt={`${displayTitle} i Havdyp`}
            fill
            quality={95}
            sizes='(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 33vw'
            loading='lazy'
            fetchPriority='low'
            className='object-contain'
          />
          <span className='absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-80' />
        </Link>

        <div className='pointer-events-none absolute top-0 left-0 z-20 flex w-full items-start justify-between p-3'>
          <span className='flex items-center justify-center rounded-full border border-white/10 bg-black/20 px-2 py-0.5 font-sans text-[9px] font-medium tracking-normal text-white/90 backdrop-blur-md md:px-2.5 md:py-1 md:text-[10px]'>
            Unisex
          </span>
        </div>

        <div className='pointer-events-none relative z-10 mt-auto flex flex-col p-3 pb-3 md:p-4 md:pb-4'>
          <div className='mb-3'>
            <h3 className='font-google-sans text-base leading-tight font-extrabold text-white md:text-xl'>
              {displayTitle}
            </h3>
            <p className='mt-0.5 font-google-sans text-sm font-medium text-white/90 md:text-base'>
              {formattedPrice}
            </p>
          </div>

          <div className='pointer-events-auto grid w-full grid-cols-1 gap-2 sm:grid-cols-2'>
            <button
              type='button'
              onClick={handleAddToCart}
              disabled={!isAvailable || isPending}
              data-track='HelpChooseCardAddToCartClick'
              aria-busy={isPending}
              className='flex h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-white/10 px-2 font-google-sans text-xs font-medium whitespace-nowrap text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isPending ?
                <Loader2 className='size-4 shrink-0 motion-safe:animate-spin' />
              : <ShoppingBag className='size-4 shrink-0 sm:hidden xl:block' />
              }
              <span>
                {isAvailable ? 'Legg i handlekurv' : 'Utsolgt'}
              </span>
            </button>

            {isAvailable && selectedVariant ?
              <div
                className='flex h-11 min-w-0 items-stretch overflow-hidden rounded-full'
                aria-label={`Betal ${displayTitle} med Klarna`}
              >
                <KlarnaProductExpressCheckout
                  product={product}
                  selectedVariant={selectedVariant}
                  quantity={1}
                  disabled={isPending}
                  theme='default'
                  className='h-full min-h-0 w-full min-w-0'
                  buttonContainerClassName='h-11! min-h-11! border-none ring-0'
                  loadingFallback={
                    <span
                      className='flex h-11 w-full items-center justify-center rounded-full bg-white px-2 font-google-sans text-xs font-medium text-black'
                      role='status'
                    >
                      Laster Klarna…
                    </span>
                  }
                />
              </div>
            : <button
                type='button'
                disabled
                className='h-11 rounded-full bg-white px-3 font-google-sans text-xs font-medium text-black opacity-60'
              >
                Utsolgt
              </button>
            }
          </div>
        </div>

        <div
          className='pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 md:group-hover:opacity-100'
          style={{
            boxShadow: `inset 0 0 20px ${glowColor}20`,
            borderColor: `${glowColor}40`
          }}
        />
      </div>

      <WishlistButton
        product={product}
        variant={selectedVariant ?? variants[0]}
        productTitle={displayTitle}
        returnTo={productUrl}
        surface='plain'
        className='absolute top-3 right-3 z-50 size-11 rounded-xl md:top-3 md:right-3 md:size-12 md:rounded-2xl'
      />
    </motion.div>
  )
}
