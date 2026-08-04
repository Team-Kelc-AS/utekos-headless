// Path: src/app/inspirasjon/isbading/sections/ComfyrobeQuickBuy.tsx
'use client'

import { useState } from 'react'
import { flattenConnection } from '@shopify/hydrogen-react'
import Image from 'next/image'
import Link from 'next/link'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ComfyrobeAccordion } from './ComfyrobeAccordion'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { NewsletterForm } from '@/components/form/components/NewsLetterForm'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import { VippsLogo } from '@/components/payments/VippsLogo'
import { KlarnaLogo } from '@/components/payments/KlarnaLogo'
import { ShoppingBag } from 'lucide-react'
import type { ShopifyProduct } from 'types/product'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { cn } from '@/lib/utils/className'
import { toast } from 'sonner'

interface Props {
  product: ShopifyProduct
}

export function ComfyrobeQuickBuy({ product }: Props) {
  const variants = flattenConnection(product.variants)
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | null
  >(variants.find(v => v.availableForSale)?.id || null)
  const selectedVariant = variants.find(
    v => v.id === selectedVariantId
  )
  const { addToCart, isPending } = useCanonicalAddToCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    if (!selectedVariant) return

    setIsAdding(true)

    void (async () => {
      try {
        const { success } = await addToCart({
          product,
          variant: selectedVariant,
          quantity: 1,
          openCart: true
        })

        if (success) {
          toast.success('Lagt i handlekurven!')
        }
      } finally {
        setIsAdding(false)
      }
    })()
  }

  const images = flattenConnection(product.images).slice(0, 5)
  const getSizeName = (title: string) => {
    const parts = title.split(' / ')
    if (parts.length > 1) {
      const sizePart = parts.find(p =>
        ['XS', 'S', 'M', 'L', 'XL'].some(s => p.includes(s))
      )
      return sizePart || parts[1] // Fallback
    }
    return title
      .replace('Fjellnatt', '')
      .replace('Unisex', '')
      .replace('/', '')
      .trim()
  }

  const price = Math.round(
    Number(product.priceRange.minVariantPrice.amount)
  )

  return (
    <div className='grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12'>
      <div className='w-full'>
        <Carousel className='w-full'>
          <CarouselContent>
            {images.map(img => {
                const imageUrlRaw = img.image?.url
                const imageUrl =
                  imageUrlRaw ? resolveImageSrc(imageUrlRaw) : null
                const altText = img.image?.altText || product.title

                if (!imageUrl) return null

                return (
                  <CarouselItem key={img.id}>
                    <div className='dark:bg-dark-background relative aspect-square w-full overflow-hidden rounded-xl border border-foreground/12 bg-background'>
                      <Image
                        src={imageUrl}
                        alt={altText}
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, 50vw'
                      />
                    </div>
                  </CarouselItem>
                )
              })}
          </CarouselContent>
          <div className='block'>
            <CarouselPrevious className='dark:bg-dark-background/70 dark:hover:bg-dark-background left-4 border border-foreground/12 bg-background/70 text-foreground backdrop-blur-md hover:bg-background' />
            <CarouselNext className='dark:bg-dark-background/70 dark:hover:bg-dark-background right-4 border border-foreground/12 bg-background/70 text-foreground backdrop-blur-md hover:bg-background' />
          </div>
        </Carousel>
      </div>

      <div className='flex flex-col gap-6 text-left'>
        <div>
          <h2 className='font-google-sans mb-2 text-3xl leading-[0.95] font-bold tracking-normal text-foreground md:text-4xl'>
            {product.title}
          </h2>
          <div className='flex items-center gap-4'>
            <span className='font-utekos-text-medium text-2xl leading-[1.15] tracking-normal text-foreground'>
              {price},-
            </span>
            <BrandBadge
              label='På lager'
              backgroundColor='var(--ancient-water)'
              textColor='var(--background)'
              className='border border-foreground/14 px-3 py-1.5 font-utekos-text-medium text-xs leading-4 tracking-normal'
            />
          </div>
        </div>

        <div className='flex gap-4'>
          <div className='flex-1 space-y-2'>
            <label className='leading-text-paragraph text-sm font-medium tracking-normal text-overcast'>
              Farge
            </label>
            <div className='dark:text-dark-background flex h-10 cursor-default items-center justify-center rounded-md border border-havdyp/35 bg-ancient-water text-sm leading-4 font-medium tracking-normal text-background ring-1 ring-havdyp/20'>
              Fjellnatt
            </div>
          </div>
          <div className='flex-1 space-y-2'>
            <label className='leading-text-paragraph text-sm font-medium tracking-normal text-overcast'>
              Modell
            </label>
            <div className='dark:text-dark-background flex h-10 cursor-default items-center justify-center rounded-md border border-havdyp/35 bg-ancient-water text-sm leading-4 font-medium tracking-normal text-background ring-1 ring-havdyp/20'>
              Unisex
            </div>
          </div>
        </div>

        {/* Størrelsevelger */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <label className='leading-text-paragraph text-sm font-medium tracking-normal text-overcast'>
              Velg størrelse
            </label>
            <Link
              href='/handlehjelp/storrelsesguide'
              className='leading-text-paragraph dark:hover:text-dark-foreground text-xs tracking-normal text-overcast underline decoration-overcast/45 underline-offset-4 hover:text-foreground'
            >
              Størrelsesguide
            </Link>
          </div>
          <div className='grid grid-cols-3 gap-3'>
            {variants.map(variant => {
              const displayName = getSizeName(variant.title)
              const isSelected = selectedVariantId === variant.id
              const isAvailable = variant.availableForSale

              return (
                <button
                  key={variant.id}
                  onClick={() =>
                    isAvailable &&
                    setSelectedVariantId(variant.id)
                  }
                  disabled={!isAvailable}
                  className={cn(
                    'relative flex h-12 items-center justify-center rounded-md border text-sm leading-4 font-medium tracking-normal transition-all',
                    isSelected ?
                      'dark:border-dark-primary/60 dark:bg-dark-primary dark:text-dark-background dark:ring-dark-primary/35 border-primary/60 bg-primary text-background ring-1 ring-primary/35'
                    : 'dark:bg-dark-background/58 dark:hover:text-dark-foreground border-foreground/14 bg-background/58 text-overcast hover:border-foreground/28 hover:text-foreground',
                    !isAvailable &&
                      'dark:bg-dark-background/45 cursor-not-allowed border-foreground/10 bg-background/45 box-decoration-slice text-overcast/55 line-through opacity-60'
                  )}
                >
                  {displayName}
                  {!isAvailable && (
                    <span className='border-chocolate-plum/35 text-chocolate-plum absolute -top-2 -right-2 rounded-full border bg-(--soft-warm) px-1.5 py-0.5 text-[10px] leading-[1.2]'>
                      Tomt
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className='space-y-4 pt-2'>
          <BrandBadge
            asChild
            backgroundColor='var(--primary)'
            textColor='var(--background)'
            className='dark:border-dark-primary/24 font-google-sans min-h-14 w-full border border-primary/24 px-8 py-4 text-lg leading-[1.35] font-bold tracking-normal shadow-xl transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 disabled:pointer-events-none disabled:opacity-60'
          >
            <button
              type='button'
              onClick={handleAddToCart}
              disabled={
                !selectedVariant || isAdding || isPending
              }
            >
              {isAdding ?
                <span className='animate-pulse'>
                  Legger til...
                </span>
              : <>
                  <ShoppingBag className='mr-2 h-5 w-5' />
                  Legg i handlekurv
                </>
              }
            </button>
          </BrandBadge>

          <div className='flex items-center justify-center gap-6 pt-2'>
            <div className='flex items-center gap-2'>
              <VippsLogo className='dark:text-dark-primary h-5 w-auto text-primary' />
            </div>
            <div className='flex items-center gap-2'>
              <KlarnaLogo className='h-6 w-auto text-(--fair-orchid)' />
            </div>
          </div>
        </div>
        <ComfyrobeAccordion />
        <div className='mt-8 rounded-xl border border-foreground/12 bg-foreground/[0.035] p-6'>
          <NewsletterForm />
        </div>
      </div>
    </div>
  )
}
