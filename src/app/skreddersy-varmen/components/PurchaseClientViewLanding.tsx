// Path: src/app/skreddersy-varmen/components/PurchaseClientViewLanding.tsx
'use client'

import Link from 'next/link'
import type { Route } from 'next'
import {
  Minus,
  Plus,
  Loader2,
  Gift,
  Ruler,
  ShoppingCart
} from 'lucide-react'
import { cn } from '@/lib/utils/className'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { ProductDetailsAccordion } from './ProductDetailsAccordion'
import { LandingPageProductCarouselPurchaseSection } from './LandingPageProductCarouselPurchaseSection'
import { KlarnaCheckoutImage } from './KlarnaCheckoutImage'
import {
  SIZE_GUIDANCE,
  focusRing,
  choiceGridClass,
  choicePillClass
} from '../utils/constants'
import { LandingPageVariantSelector } from './LandingPageVariantSelector'
import { getModelName } from '@/app/skreddersy-varmen/utils/getModelName'
import { LandingProductHighlightsPanel } from './LandingProductHighlightsPanel'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { ShippingAndReturnComponent } from './ShippingAndReturnComponent'
import { KlarnaLandingExpressCheckout } from './KlarnaLandingExpressCheckout'
import { reportLandingSelectPromotion } from '@/app/skreddersy-varmen/utils/reportLandingSelectPromotion'
import type { ModelKey, PRODUCT_VARIANTS } from '@/api/constants'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

export type PurchaseClientViewLandingProps = {
  selectedModel: ModelKey
  setSelectedModel: (model: ModelKey) => void
  quantity: number
  setQuantity: (qty: number) => void
  selectedColorIndex: number
  setSelectedColorIndex: (index: number) => void
  selectedSize: string
  setSelectedSize: (size: string) => void
  selectableSizes: string[]
  handleAddToCart: () => void
  isPending: boolean
  currentConfig: (typeof PRODUCT_VARIANTS)[ModelKey]
  isTechDownOffer: boolean
  shopifyProduct: ShopifyProduct | null
  selectedShopifyVariant: ShopifyProductVariant | null
}

export function PurchaseClientViewLanding({
  selectedModel,
  setSelectedModel,
  quantity,
  setQuantity,
  selectedColorIndex,
  setSelectedColorIndex,
  selectedSize,
  setSelectedSize,
  selectableSizes,
  handleAddToCart,
  isPending,
  currentConfig,
  isTechDownOffer,
  shopifyProduct,
  selectedShopifyVariant
}: PurchaseClientViewLandingProps) {
  const guidance = SIZE_GUIDANCE[selectedSize]
  const modelName = getModelName(currentConfig.title)
  const visibleSizes = selectableSizes ?? currentConfig.sizes

  return (
    <>
      <article className='relative w-full max-w-full overflow-x-clip text-background min-[900px]:grid min-[900px]:grid-cols-2'>
        <LandingPageProductCarouselPurchaseSection
          selectedModel={selectedModel}
          currentConfig={currentConfig}
        />

        <div className='flex w-full flex-col bg-foreground'>
          <div className='flex-1 p-6 min-[1280px]:p-20 md:p-12'>
            <LandingPageVariantSelector
              selectedModel={selectedModel}
              setSelectedModel={(model: ModelKey) =>
                setSelectedModel(model as ModelKey)
              }
            />
            <div key={`hero-${selectedModel}`} className='mb-10'>
              <h2 className='font-google-sans mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-sans text-4xl leading-[0.95] font-bold tracking-[-0.01em] text-background min-[1280px]:text-7xl'>
                <span className='sr-only'>Utekos </span>
                <UtekosWordmark
                  aria-hidden
                  className='h-[0.82em] w-auto translate-y-[0.04em]'
                  style={{ color: 'var(--color-background)' }}
                />
                <span className='font-google-sans font-sans font-bold tracking-[-0.015em]'>
                  {modelName}
                </span>
              </h2>

              <p className='leading-text-paragraph mb-8 max-w-152 text-lg tracking-normal text-background/90 md:text-xl'>
                {currentConfig.subtitle}
              </p>

              <div className='space-y-4'>
                <p className='font-google-sans text-4xl font-bold tracking-tight text-background tabular-nums min-[900px]:text-5xl min-[1280px]:text-6xl min-[1280px]:leading-none'>
                  {currentConfig.price},-
                </p>
                <KlarnaCheckoutImage className='min-[900px]:max-w-md' />
              </div>

              {isTechDownOffer && (
                <div className='mt-8 flex items-center gap-4 rounded-lg border border-accent/30 bg-accent/10 p-4 shadow-sm'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/20'>
                    <Gift className='size-5 text-accent' />
                  </div>
                  <div>
                    <h3 className='font-utekos-text-medium text-background'>
                      Sommertilbud
                    </h3>
                    <p className='text-sm text-background/80'>
                      10% rabatt + Gratis Buff™ (verdi 249,-)
                      legges til i kurven.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div
              key={`details-${selectedModel}`}
              className='mb-12 space-y-8'
              aria-label='Produktinformasjon'
            >
              <AnimatedBlock
                className='will-animate-fade-in-up'
                delay='0.05s'
                rootMargin='0px 0px 25% 0px'
                threshold={0.01}
              >
                <p className='leading-text-paragraph text-base text-background/85 md:text-lg'>
                  {currentConfig.description}
                </p>
              </AnimatedBlock>

              <AnimatedBlock
                className='will-animate-fade-in-up'
                delay='0.1s'
                rootMargin='0px 0px 25% 0px'
                threshold={0.01}
              >
                <div className={choiceGridClass}>
                  {currentConfig.features.map(feature => (
                    <span
                      key={feature}
                      className={cn(
                        choicePillClass,
                        'font-google-sans border border-border bg-muted font-bold text-foreground shadow-sm'
                      )}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </AnimatedBlock>

              <AnimatedBlock
                className='will-animate-fade-in-up'
                delay='0.15s'
                rootMargin='0px 0px 25% 0px'
                threshold={0.01}
              >
                <LandingProductHighlightsPanel
                  modelName={modelName}
                  selectedModel={selectedModel}
                  highlights={currentConfig.highlights}
                />
              </AnimatedBlock>
            </div>

            <div className='mb-12 h-px w-full bg-background/10' />

            <div className='mb-12 space-y-12'>
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <span className='font-google-sans text-sm font-bold tracking-normal text-background'>
                    Størrelse
                  </span>
                  <Link
                    href={
                      '/handlehjelp/storrelsesguide' as Route
                    }
                    data-track='SizeGuideSkreddersyVarmen'
                    onClick={() =>
                      reportLandingSelectPromotion('sizeGuide')
                    }
                    className='text-sm text-background underline transition-colors hover:text-primary'
                  >
                    Se størrelsesguide
                  </Link>
                </div>

                <div
                  className={choiceGridClass}
                  role='radiogroup'
                  aria-label='Velg størrelse'
                >
                  {visibleSizes.map(size => {
                    const isActive = selectedSize === size
                    const sizePillClassName = cn(
                      choicePillClass,
                      isActive ?
                        'border border-background bg-background text-foreground shadow-md'
                      : 'border border-background/15 bg-foreground text-background hover:bg-background/5',
                      focusRing
                    )

                    return isActive ?
                        <button
                          key={size}
                          type='button'
                          role='radio'
                          aria-checked='true'
                          aria-label={`Størrelse ${size}`}
                          onClick={() => setSelectedSize(size)}
                          className={sizePillClassName}
                        >
                          {size}
                        </button>
                      : <button
                          key={size}
                          type='button'
                          role='radio'
                          aria-checked='false'
                          aria-label={`Størrelse ${size}`}
                          onClick={() => setSelectedSize(size)}
                          className={sizePillClassName}
                        >
                          {size}
                        </button>
                  })}
                </div>

                {guidance && (
                  <div
                    key={selectedSize}
                    className='animate-in fade-in slide-in-from-top-2 mt-3 duration-300'
                  >
                    <div className='relative overflow-hidden rounded-2xl border border-primary/20 bg-jungle p-4 text-foreground shadow-md'>
                      <div className='mb-2 flex items-center gap-2 border-b border-foreground/15 pb-2'>
                        <Ruler className='size-4 text-primary' />
                        <span className='font-google-sans text-sm font-bold tracking-normal text-foreground'>
                          Passer best for deg som er{' '}
                          {guidance.height}
                        </span>
                      </div>
                      <ul className='mt-2 space-y-1.5'>
                        {guidance.tips.map((tip, i) => (
                          <li
                            key={i}
                            className='leading-text-paragraph /90 text-sm text-foreground/90'
                          >
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className='mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-background/10 pt-4'>
                  <div
                    className='min-w-0'
                    role='radiogroup'
                    aria-label='Velg farge'
                  >
                    <span className='mb-2 block font-utekos-text-medium text-xs tracking-normal text-background/80'>
                      Farge
                    </span>

                    <div className='mt-1 grid w-full grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2'>
                      {currentConfig.colors.map(
                        (colorObj, index) => {
                          const isActive =
                            selectedColorIndex === index
                          const isInteractive =
                            currentConfig.colors.length > 1
                          const colorPillClassName = cn(
                            'inline-flex h-10 min-w-0 items-center justify-start gap-2 rounded-full border border-background/15 bg-foreground px-3 font-utekos-text-medium text-sm text-background transition',
                            isInteractive &&
                              'hover:bg-background/5',
                            !isInteractive && 'cursor-default',
                            isActive &&
                              'border-background shadow-sm ring-1 ring-background',
                            focusRing
                          )
                          const colorPillContent = (
                            <>
                              <span
                                className='size-4 shrink-0 rounded-full border border-background/20 shadow-sm'
                                style={{
                                  backgroundColor: colorObj.hex
                                }}
                              />
                              <span className='truncate'>
                                {colorObj.name}
                              </span>
                            </>
                          )

                          return isActive ?
                              <button
                                key={colorObj.name}
                                type='button'
                                role='radio'
                                aria-checked='true'
                                aria-label={`Farge ${colorObj.name}`}
                                onClick={() =>
                                  isInteractive &&
                                  setSelectedColorIndex(index)
                                }
                                className={colorPillClassName}
                              >
                                {colorPillContent}
                              </button>
                            : <button
                                key={colorObj.name}
                                type='button'
                                role='radio'
                                aria-checked='false'
                                aria-label={`Farge ${colorObj.name}`}
                                onClick={() =>
                                  isInteractive &&
                                  setSelectedColorIndex(index)
                                }
                                className={colorPillClassName}
                              >
                                {colorPillContent}
                              </button>
                        }
                      )}
                    </div>
                  </div>

                  <div className='shrink-0'>
                    <span className='mb-2 block font-utekos-text-medium text-xs tracking-normal text-background/80'>
                      Antall
                    </span>

                    <div className='mt-1 flex h-10 items-center rounded-full border border-background/15 bg-foreground text-background'>
                      <button
                        type='button'
                        onClick={() => setQuantity(quantity - 1)}
                        className={cn(
                          'flex size-10 items-center justify-center rounded-l-full text-background transition-colors hover:bg-background/5',
                          focusRing
                        )}
                        aria-label='Reduser antall'
                      >
                        <Minus size={17} />
                      </button>

                      <span
                        className='w-9 text-center font-utekos-text-medium text-base text-background tabular-nums'
                        aria-live='polite'
                        aria-atomic='true'
                      >
                        {quantity}
                      </span>

                      <button
                        type='button'
                        onClick={() => setQuantity(quantity + 1)}
                        className={cn(
                          'flex size-10 items-center justify-center rounded-r-full text-background transition-colors hover:bg-background/5',
                          focusRing
                        )}
                        aria-label='Øk antall'
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-background/20 bg-card p-6 text-foreground min-[900px]:p-8 min-[1280px]:p-12 md:p-12'>
            <div className='mb-4 min-[900px]:mb-6 min-[1280px]:mb-8'>
              <BrandBadge
                asChild
                bgColor='var(--primary)'
                fgColor='var(--primary-foreground)'
                className={cn(
                  'font-google-sans hover:bg-primary-hover h-14 w-full min-w-0 px-4 py-0 text-sm font-bold tracking-normal shadow-[0_4px_20px_rgba(255,180,120,0.15)] transition-[transform,filter,box-shadow] hover:text-primary-foreground hover:shadow-[0_4px_25px_rgba(255,180,120,0.3)] hover:brightness-105 active:scale-[0.985] sm:text-base md:h-16 md:px-6 md:text-lg',
                  isPending && 'cursor-not-allowed opacity-80'
                )}
              >
                {isPending ?
                  <button
                    type='button'
                    onClick={handleAddToCart}
                    data-track='SkreddersyVarmenAddToCartClick'
                    disabled
                    aria-busy='true'
                    className={cn(
                      'flex w-full min-w-0 items-center justify-center gap-2 text-center',
                      focusRing
                    )}
                  >
                    <Loader2 className='size-5 animate-spin' />
                    <span className='whitespace-nowrap'>
                      Legger i handlekurv
                    </span>
                  </button>
                : <button
                    type='button'
                    onClick={handleAddToCart}
                    data-track='SkreddersyVarmenAddToCartClick'
                    className={cn(
                      'flex w-full min-w-0 items-center justify-center gap-2 text-center',
                      focusRing
                    )}
                  >
                    <ShoppingCart className='size-5 shrink-0' />
                    <span className='whitespace-nowrap'>
                      Legg i handlekurv
                    </span>
                    <span className='hidden h-5 w-px bg-background/20 sm:block' />
                    <span className='font-google-sans hidden font-bold whitespace-nowrap sm:inline'>
                      {currentConfig.price * quantity},-
                    </span>
                  </button>
                }
              </BrandBadge>
            </div>

            <KlarnaLandingExpressCheckout
              product={shopifyProduct}
              selectedVariant={selectedShopifyVariant}
              quantity={quantity}
              className='mb-4 min-[900px]:mb-6 min-[1280px]:mb-8'
            />

            {/* Teksten tilktnyttet frakt/retur blir automatisk synlig mot card-bakgrunnen */}
            <ShippingAndReturnComponent />
          </div>
        </div>
      </article>

      <ProductDetailsAccordion selectedModel={selectedModel} />
    </>
  )
}
