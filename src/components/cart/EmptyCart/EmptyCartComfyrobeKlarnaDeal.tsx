'use client'

import { useQuery } from '@tanstack/react-query'
import { comfyrobeCartDealOptions } from '@/api/lib/products/comfyrobeCartDealOptions'
import { buildComfyrobeOfferSummary } from '@/app/(store)/comfyrobe/lib/buildComfyrobeOfferSummary'
import { findMatchingVariant } from '@/components/ProductCard/findMatchingVariant'
import { getInitialAvailableOptions } from '@/components/ProductCard/getInitialAvailableOptions'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import Image from 'next/image'

function refreshKlarnaPlacements() {
  const klarna = window.Klarna as
    | {
        OnsiteMessaging?: { refresh: () => void }
      }
    | undefined

  klarna?.OnsiteMessaging?.refresh()
}

/**
 * Klarna Deals prerequisite: OSM on cart pages.
 * @see https://docs.klarna.com/acquirer/klarna/web-payments/additional-resources/use-cases/klarna-deals-promotions/
 * @see https://docs.klarna.com/acquirer/klarna/on-site-messaging/additional-resources/placements/
 *
 * Empty cart has no order lines. This card adds a verified Comfyrobe variant;
 * the resulting Klarna session carries the SKU and assortment metadata needed
 * for Klarna to apply a configured product-specific Deal at checkout.
 */
export function EmptyCartComfyrobeKlarnaDeal() {
  const { data: product } = useQuery(comfyrobeCartDealOptions)
  const { addToCart, isPending, isCartBusy } =
    useCanonicalAddToCart()
  const offer =
    product ? buildComfyrobeOfferSummary(product) : null
  const selectedVariant =
    product ?
      findMatchingVariant(
        product,
        getInitialAvailableOptions(product)
      )
    : undefined

  if (!product || !offer?.klarnaPurchaseAmount) {
    return null
  }

  const addComfyrobe = () => {
    if (!selectedVariant) return

    void addToCart({
      product,
      variant: selectedVariant,
      quantity: 1,
      openCart: false
    })
  }

  return (
    <section
      aria-labelledby='empty-cart-comfyrobe-deal-title'
      className='mb-6 rounded-lg border border-border bg-card p-4'
    >
      <KlarnaOnSiteMessagingScript
        strategy='lazyOnload'
        onReady={refreshKlarnaPlacements}
      />

      <div className='flex items-start gap-4'>
        {product.featuredImage ?
          <div className='w-20 shrink-0 overflow-hidden rounded-md bg-muted'>
            <AspectRatio ratio={1}>
              <Image
                src={product.featuredImage.url}
                alt={
                  product.featuredImage.altText ||
                  'Comfyrobe™ i Fjellnatt'
                }
                fill
                className='object-contain'
                sizes='80px'
              />
            </AspectRatio>
          </div>
        : null}

        <div className='min-w-0 flex-1'>
          <p className='font-sans font-medium text-xs text-muted-foreground'>
            Klarna Deal
          </p>
          <h3
            id='empty-cart-comfyrobe-deal-title'
            className='mt-1 font-google-sans font-extrabold text-lg text-foreground'
          >
            Comfyrobe™
          </h3>
          <p className='mt-1 font-sans font-medium text-sm text-foreground'>
            {offer.priceLabel}
          </p>
        </div>
      </div>

      <div className='mt-3'>
        <KlarnaCreditPromotionAutoSize
          id='klarna-credit-promotion-empty-cart-comfyrobe'
          purchaseAmount={offer.klarnaPurchaseAmount}
          theme='default'
          className='block'
        />
      </div>

      <Button
        type='button'
        variant='default'
        onClick={addComfyrobe}
        disabled={
          !selectedVariant ||
          !selectedVariant.availableForSale ||
          isPending ||
          isCartBusy
        }
        className='mt-4 min-h-11 w-full font-sans font-semibold'
      >
        Legg til Comfyrobe™
      </Button>
    </section>
  )
}
