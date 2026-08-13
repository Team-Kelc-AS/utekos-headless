'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import { Button } from '@/components/ui/button'
import { useAddToCartAction } from '@/hooks/useAddToCartAction'
import { reportCanonicalSelectPromotion } from '@/lib/analytics/selectPromotionReporter'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type ComfyrobeHeroActionsProps = {
  primaryLabel: string
  product: ProductCartModel | null
  selectedVariant: ProductPurchaseVariant | null
}

function createInteractionId(): string {
  try {
    return globalThis.crypto.randomUUID()
  } catch {
    return `comfyrobe-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  }
}

function reportHeroSelection(
  creativeName: string,
  creativeSlot: string
): void {
  try {
    reportCanonicalSelectPromotion({
      customData: {
        interaction_id: createInteractionId(),
        promotion_id: 'comfyrobe-hero',
        promotion_name: 'Comfyrobe',
        creative_name: creativeName,
        creative_slot: creativeSlot
      }
    })
  } catch {
    return
  }
}

function ComfyrobeHeroPurchaseActions({
  product,
  selectedVariant
}: {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant
}) {
  const { performAddToCart, isAddToCartPending, isPending } =
    useAddToCartAction({ product, selectedVariant })
  const isUnavailable = !selectedVariant.availableForSale

  return (
    <div className='flex w-full flex-col gap-3 sm:w-72 md:w-144'>
      <Button
        type='button'
        data-track='ComfyrobeHeroAddToCart'
        disabled={isPending || isUnavailable}
        onClick={() => {
          reportHeroSelection('Legg i handlekurv', 'primary_cta')
          void performAddToCart(1)
        }}
        className='h-14 w-full rounded-full bg-primary font-utekos-text-medium text-base text-foreground hover:bg-primary/90 md:text-lg'
      >
        {isAddToCartPending ?
          <>
            <Loader2
              data-icon='inline-start'
              className='animate-spin'
            />
            Legger til …
          </>
        : 'Legg i handlekurv'}
      </Button>

      <KlarnaProductExpressCheckout
        product={product}
        selectedVariant={selectedVariant}
        quantity={1}
        disabled={isPending || isUnavailable}
        theme='light'
        className='w-full min-w-0'
        buttonContainerClassName='h-14 min-h-14 border-none ring-0'
      />
    </div>
  )
}

export function ComfyrobeHeroActions({
  primaryLabel,
  product,
  selectedVariant
}: ComfyrobeHeroActionsProps) {
  return (
    <div className='mt-6 flex max-w-xl flex-col items-start gap-3 sm:flex-row sm:items-center md:mt-8'>
      {product && selectedVariant ?
        <ComfyrobeHeroPurchaseActions
          product={product}
          selectedVariant={selectedVariant}
        />
      : <BrandBadge
          asChild
          className='min-h-13 w-full gap-2 bg-primary px-6 py-3 font-utekos-text-medium text-foreground transition-[filter,transform] hover:brightness-105 active:scale-[0.985] sm:w-auto'
        >
          <a
            href='#purchase-section'
            data-track='ComfyrobeHeroPrimaryCta'
            onClick={() =>
              reportHeroSelection(
                'Velg størrelse',
                'primary_cta'
              )
            }
          >
            {primaryLabel}

            <ArrowRight className='size-4' aria-hidden='true' />
          </a>
        </BrandBadge>
      }
    </div>
  )
}
