'use client'

import { useAddToCartAction } from '@/hooks/useAddToCartAction'
import { useCanonicalProductListVisibility } from '@/hooks/useCanonicalProductListVisibility'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { reportProductListSelectItem } from '@/lib/analytics/reportProductListSelectItem'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { flattenConnection } from '@shopify/hydrogen-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowUpRight,
  Loader2,
  ShoppingBag,
  X
} from 'lucide-react'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type {
  ShopifyProduct,
  ShopifyProductVariant
} from 'types/product'

interface HelpChooseCardProps {
  product: ShopifyProduct
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
  const v = product.variants as ProductVariantsShape
  if (Array.isArray(v)) return v
  if (v?.nodes) return flattenConnection({ nodes: v.nodes })
  if (v?.edges) return flattenConnection({ edges: v.edges })
  return []
}

function getDefaultColor(
  variants: ShopifyProductVariant[]
): string | null {
  for (const variant of variants) {
    const color = variant.selectedOptions.find(
      o => o.name === 'Color' || o.name === 'Farge'
    )?.value
    if (color) return color
  }
  return null
}

export function HelpChooseCard({
  product,
  index,
  glowColor,
  totalItemCount
}: HelpChooseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const variants = normalizeVariants(product)
  const defaultColor = getDefaultColor(variants)

  const [isSelectingSize, setIsSelectingSize] = useState(false)
  const [selectedVariant, setSelectedVariant] =
    useState<ShopifyProductVariant | null>(null)
  const [pendingAdd, setPendingAdd] = useState(false)

  const selectedColor = defaultColor

  const colorImage =
    selectedColor ?
      variants.find(v =>
        v.selectedOptions.some(
          o =>
            (o.name === 'Color' || o.name === 'Farge') &&
            o.value === selectedColor
        )
      )?.image?.url
    : null

  const availableSizes =
    selectedColor ?
      variants
        .filter(v => {
          const vColor = v.selectedOptions.find(
            o => o.name === 'Color' || o.name === 'Farge'
          )?.value
          return vColor === selectedColor && v.availableForSale
        })
        .map(v => ({
          id: v.id,
          title:
            v.selectedOptions.find(
              o => o.name === 'Size' || o.name === 'Størrelse'
            )?.value || 'One Size',
          variant: v
        }))
    : variants
        .filter(v => v.availableForSale)
        .map(v => ({
          id: v.id,
          title:
            v.selectedOptions.find(
              o => o.name === 'Size' || o.name === 'Størrelse'
            )?.value || 'One Size',
          variant: v
        }))

  const { performAddToCart, isPending } = useAddToCartAction({
    product,
    selectedVariant: selectedVariant
  })

  useEffect(() => {
    if (!pendingAdd) return
    if (!selectedVariant) return

    const pendingTimer = window.setTimeout(() => {
      performAddToCart(1)
      setPendingAdd(false)
    }, 0)

    return () => window.clearTimeout(pendingTimer)
  }, [pendingAdd, selectedVariant, performAddToCart])

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product.availableForSale) return
    setIsSelectingSize(true)
  }

  const handleSizeSelect = (
    e: React.MouseEvent,
    variant: ShopifyProductVariant
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedVariant(variant)
    setPendingAdd(true)
  }

  const activeImage =
    colorImage || product.featuredImage?.url || ''

  const price = product.priceRange.minVariantPrice.amount
  const formattedPrice = `${parseInt(price).toLocaleString('no-NO')} kr`
  const isOutOfStock = !product.availableForSale
  const selectItemVariant =
    selectedVariant ??
    availableSizes[0]?.variant ??
    variants.find(variant => variant.availableForSale) ??
    variants[0] ??
    null
  const productUrl = `/produkter/${product.handle}` as Route

  useCanonicalProductListVisibility({
    elementRef: cardRef,
    itemListId: 'help_choose_carousel',
    itemListName: 'Hjelp meg å velge',
    product,
    totalItemCount,
    variant: selectItemVariant
  })

  const handleViewProduct = () => {
    const destinationUrl =
      typeof window === 'undefined' ? productUrl : (
        new URL(productUrl, window.location.origin).toString()
      )

    reportProductListSelectItem({
      product,
      variant: selectItemVariant,
      itemListId: 'help_choose_carousel',
      destinationUrl
    })
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
      onMouseLeave={() => setIsSelectingSize(false)}
    >
      <Link
        href={productUrl}
        className='block size-full'
        data-track='HelpChooseCardViewMoreClick'
        onClick={handleViewProduct}
      >
        <div className='relative flex aspect-2/3 h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 shadow-2xl transition-transform duration-300 md:hover:-translate-y-1'>
          <div className='absolute inset-0 z-0 bg-neutral-800'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={resolveImageSrc(activeImage)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className='absolute inset-0'
              >
                <Image
                  src={activeImage}
                  alt={product.title}
                  fill
                  quality={95}
                  sizes='(max-width: 640px) 50vw, 25vw'
                  loading='lazy'
                  fetchPriority='low'
                  className={`object-cover transition-transform duration-700 will-change-transform ${
                    isSelectingSize ?
                      'scale-105 blur-[2px]'
                    : 'group-hover:scale-105'
                  }`}
                />
              </motion.div>
            </AnimatePresence>
            <div className='absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-80' />
          </div>

          <div className='absolute top-0 left-0 z-30 flex w-full items-start justify-between p-3'>
            <div className='flex items-center justify-center rounded-full border border-white/10 bg-black/20 px-2 py-0.5 backdrop-blur-md md:px-2.5 md:py-1'>
              <span className='font-utekos-text-medium text-[9px] tracking-wider text-white/90 uppercase md:text-[10px]'>
                Unisex
              </span>
            </div>
          </div>

          <div className='relative z-10 mt-auto flex flex-col p-3 pb-3 md:p-4 md:pb-4'>
            <div className='mb-3'>
              <h3 className='font-heading font-google-sans text-base leading-tight font-bold text-white md:text-xl'>
                {product.title}
              </h3>
              <div className='mt-0.5 flex items-baseline gap-2'>
                <span className='font-google-sans text-sm font-bold text-white/90 md:text-base'>
                  {formattedPrice}
                </span>
              </div>
            </div>

            <div className='relative h-10 w-full'>
              <AnimatePresence mode='wait' initial={false}>
                {!isSelectingSize ?
                  <motion.div
                    key='default-actions'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className='grid grid-cols-[1fr_auto] gap-2'
                  >
                    <div className='flex h-10 items-center justify-center gap-2 rounded-full bg-white/10 backdrop-blur-md transition-colors duration-300 md:group-hover:bg-white/20'>
                      <span className='font-utekos-text-medium text-xs text-white'>
                        Les mer
                      </span>
                      <ArrowUpRight className='h-3.5 w-3.5 text-white/80' />
                    </div>

                    <button
                      onClick={handleBuyClick}
                      disabled={isOutOfStock}
                      className={`flex h-10 w-12 items-center justify-center rounded-full bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform active:scale-90 md:w-auto md:px-5 ${
                        isOutOfStock ? 'opacity-50' : ''
                      }`}
                    >
                      {isOutOfStock ?
                        <span className='font-google-sans text-[10px] font-bold'>
                          TOMT
                        </span>
                      : <>
                          <ShoppingBag className='h-4 w-4 md:mr-2' />
                          <span className='font-google-sans hidden text-xs font-bold md:block'>
                            Kjøp nå
                          </span>
                        </>
                      }
                    </button>
                  </motion.div>
                : <motion.div
                    key='size-selector'
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className='flex h-10 w-full items-center gap-1 overflow-hidden rounded-full bg-white p-1 pr-1 shadow-xl'
                  >
                    <button
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsSelectingSize(false)
                      }}
                      className='flex h-8 w-8 min-w-8 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200'
                      aria-label='Lukk'
                    >
                      <X className='h-4 w-4 text-black' />
                    </button>

                    <div className='no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto px-1'>
                      {availableSizes.map(size => (
                        <button
                          key={size.id}
                          onClick={e =>
                            handleSizeSelect(e, size.variant)
                          }
                          disabled={isPending}
                          className='font-google-sans flex h-8 max-w-17 min-w-9 flex-1 items-center justify-center overflow-hidden rounded-full bg-black px-2 text-xs font-bold text-white transition-transform active:scale-95'
                          aria-label={`Velg størrelse ${size.title}`}
                          title={size.title}
                        >
                          {(
                            isPending &&
                            selectedVariant?.id === size.id
                          ) ?
                            <Loader2 className='h-3 w-3 animate-spin' />
                          : <span className='min-w-0 truncate whitespace-nowrap'>
                              {size.title}
                            </span>
                          }
                        </button>
                      ))}

                      {availableSizes.length === 0 && (
                        <div className='flex h-8 items-center justify-center rounded-full bg-neutral-200 px-3 font-utekos-text-medium text-[11px] whitespace-nowrap text-black'>
                          Ingen størrelser
                        </div>
                      )}
                    </div>
                  </motion.div>
                }
              </AnimatePresence>
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
      </Link>
      <WishlistButton
        product={product}
        variant={
          selectedVariant ??
          availableSizes[0]?.variant ??
          variants[0]
        }
        productTitle={product.title}
        returnTo={`/produkter/${product.handle}`}
        className='absolute top-3 right-3 z-50 size-11 rounded-xl md:top-3 md:right-3 md:size-12 md:rounded-2xl'
      />
    </motion.div>
  )
}
