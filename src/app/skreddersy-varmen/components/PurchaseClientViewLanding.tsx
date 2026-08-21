'use client'

import {
  Minus,
  Plus,
  Loader2,
  Ruler,
  ShoppingCart
} from 'lucide-react'
import { cn } from '@/lib/utils/className'
import { formatPrice } from '@/lib/utils/formatPrice'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { ProductDetailsAccordion } from './ProductDetailsAccordion'
import { LandingPageProductCarouselPurchaseSection } from './LandingPageProductCarouselPurchaseSection'
import {
  SIZE_GUIDANCE,
  focusRing,
  choiceGridClass,
  choicePillClass
} from '../utils/constants'
import { LandingProductHighlightsPanel } from './LandingProductHighlightsPanel'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { ShippingAndReturnComponent } from './ShippingAndReturnComponent'
import { KlarnaLandingExpressCheckout } from './KlarnaLandingExpressCheckout'
import { PRODUCT_VARIANTS } from '@/api/constants'
import { TechDownSizeGuideAccordion } from './TechDownSizeGuideAccordion'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

const techDownContent = PRODUCT_VARIANTS['utekos-techdown']

export type PurchaseClientViewLandingProps = {
  quantity: number
  setQuantity: (qty: number) => void
  selectedSize: string
  setSelectedSize: (size: string) => void
  sizeOptions: Array<{
    label: string
    availableForSale: boolean
  }>
  handleAddToCart: () => void
  isPending: boolean
  isAddToCartPending: boolean
  commerce: ProductCommerceViewModel
  shopifyProduct: ProductCartModel
  selectedShopifyVariant: ProductPurchaseVariant | null
}

export function PurchaseClientViewLanding({
  quantity,
  setQuantity,
  selectedSize,
  setSelectedSize,
  sizeOptions,
  handleAddToCart,
  isPending,
  isAddToCartPending,
  commerce,
  shopifyProduct,
  selectedShopifyVariant
}: PurchaseClientViewLandingProps) {
  const guidance = SIZE_GUIDANCE[selectedSize]
  const modelName = commerce.displayName.replace(
    /^Utekos\s+/u,
    ''
  )
  const isAvailable =
    selectedShopifyVariant?.availableForSale ?? false
  const currentPrice = selectedShopifyVariant?.price
  const compareAtPrice = selectedShopifyVariant?.compareAtPrice
  const hasCompareAtPrice = Boolean(
    currentPrice &&
    compareAtPrice &&
    Number(compareAtPrice.amount) > Number(currentPrice.amount)
  )

  return (
    <>
      <section className='relative w-full max-w-full overflow-x-clip text-background min-[900px]:grid min-[900px]:grid-cols-2'>
        <LandingPageProductCarouselPurchaseSection />

        <div className='flex w-full flex-col bg-[#F3F0E7] text-foreground'>
          <div className='flex-1 bg-[#F3F0E7] p-8 text-background min-[900px]:rounded-tl-3xl min-[1280px]:p-20 md:p-12'>
            <div className='mb-4 font-utekos-text-medium text-sm text-background/80'>
              Utekos TechDown™ · Bestselger
            </div>

            <div className='mb-6 min-[900px]:mb-8'>
              <h2 className='mb-4 flex flex-nowrap items-baseline gap-x-3 font-sans text-4xl leading-[0.95] font-bold tracking-[-0.01em] text-background min-[1280px]:text-7xl'>
                <span className='sr-only'>Utekos </span>
                <UtekosWordmark
                  aria-hidden
                  className='h-[0.82em] w-auto shrink-0 translate-y-[0.04em] text-background'
                />
                <span className='whitespace-nowrap font-sans font-bold tracking-[-0.04em]'>
                  {modelName}
                </span>
              </h2>

              <p className='leading-text-paragraph mb-6 max-w-152 font-sans text-lg font-normal tracking-normal text-background/90 min-[900px]:mb-8 md:text-xl'>
                Vår nyeste, varmeste og mest allsidige modell.
              </p>

              {currentPrice ?
                <div className='space-y-8 min-[900px]:space-y-3'>
                  <div className='flex flex-wrap items-baseline gap-3'>
                    <p className='font-google-sans text-4xl font-bold tracking-tight text-background tabular-nums min-[900px]:text-5xl min-[1280px]:text-6xl min-[1280px]:leading-none'>
                      {formatPrice(currentPrice)}
                    </p>
                    {hasCompareAtPrice && compareAtPrice ?
                      <p className='text-lg text-background/70 tabular-nums line-through md:text-xl'>
                        {formatPrice(compareAtPrice)}
                      </p>
                    : null}
                  </div>
                </div>
              : null}
            </div>

            <div
              className='mb-6 space-y-6 min-[900px]:mb-12 min-[900px]:space-y-8'
              aria-label='Produktinformasjon'
            >
              <AnimatedBlock
                className='will-animate-fade-in-up'
                delay='0.05s'
                rootMargin='0px 0px 25% 0px'
                threshold={0.01}
              >
                <div className={choiceGridClass}>
                  {techDownContent.features.map(feature => (
                    <span
                      key={feature}
                      className={cn(
                        choicePillClass,
                        'rounded-2xl border border-border bg-jungle-tone font-sans text-[11px] text-foreground shadow-sm min-[900px]:font-bold md:max-xl:text-[14px]'
                      )}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </AnimatedBlock>

              <AnimatedBlock
                className='will-animate-fade-in-up'
                delay='0.1s'
                rootMargin='0px 0px 25% 0px'
                threshold={0.01}
              >
                <LandingProductHighlightsPanel
                  modelName={modelName}
                  selectedModel='utekos-techdown'
                  highlights={techDownContent.highlights}
                />
              </AnimatedBlock>
            </div>

            <div className='mb-6 h-px w-full bg-background/10 min-[900px]:mb-12' />

            <div className='mb-0 space-y-12 text-foreground min-[900px]:mb-4'>
              <div className='overflow-hidden rounded-xl bg-jungle p-6 min-[900px]:p-6'>
                <div className='mb-4 flex items-center justify-between min-[900px]:mb-4'>
                  <span className='font-sans text-sm font-bold tracking-normal text-foreground'>
                    Størrelse
                  </span>
                </div>

                <div
                  className={choiceGridClass}
                  role='radiogroup'
                  aria-label='Velg størrelse'
                >
                  {sizeOptions.map(size => {
                    const isActive = selectedSize === size.label

                    return (
                      <button
                        key={size.label}
                        type='button'
                        role='radio'
                        aria-checked={isActive}
                        aria-label={`Størrelse ${size.label}${size.availableForSale ? '' : ', utsolgt'}`}
                        onClick={() =>
                          setSelectedSize(size.label)
                        }
                        className={cn(
                          choicePillClass,
                          'rounded-xl! max-md:text-[15px]! md:rounded-2xl!',
                          isActive ?
                            'cursor-pointer border border-foreground/20 bg-primary text-base text-foreground shadow-none hover:opacity-70 sm:text-base md:text-base'
                          : 'cursor-pointer border-none bg-jungle-tone text-base text-foreground hover:opacity-70 sm:text-base md:text-base',
                          !size.availableForSale && 'opacity-65',
                          focusRing
                        )}
                      >
                        <span>{size.label}</span>
                        {!size.availableForSale ?
                          <span className='sr-only'>
                            Utsolgt
                          </span>
                        : null}
                      </button>
                    )
                  })}
                </div>

                <div className='mt-4 flex flex-col gap-4'>
                  {guidance ?
                    <div
                      key={selectedSize}
                      className='animate-in fade-in slide-in-from-top-2 duration-300'
                    >
                      <div className='relative overflow-hidden rounded-2xl border-none bg-jungle-tone p-4 font-utekos-text text-foreground shadow-md md:p-6'>
                        <div className='mb-2 flex items-center gap-2 border-b border-foreground/15 pb-2'>
                          <Ruler className='size-4 text-primary' />
                          <span className='font-utekos-text text-sm font-bold tracking-normal text-foreground'>
                            Anbefaling: For deg mellom{' '}
                            {guidance.height}
                          </span>
                        </div>
                        <ul className='mt-2 space-y-1.5'>
                          {guidance.tips.map(tip => (
                            <li
                              key={tip}
                              className='leading-text-paragraph text-sm text-foreground/90'
                            >
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  : null}

                  <TechDownSizeGuideAccordion />
                </div>

                <div className='mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-foreground/10 pt-4 min-[900px]:mt-4'>
                  <div className='min-w-0'>
                    <span className='mb-2 block font-utekos-text-medium text-xs tracking-normal text-foreground/80'>
                      FARGE
                    </span>
                    <div className='mt-1 inline-flex h-10 w-29 items-center justify-center gap-2 rounded-full border-none bg-cloud-dancer px-3 font-utekos-text-medium text-sm text-background shadow-sm ring-1 ring-background'>
                      <span
                        aria-hidden
                        className='size-4 shrink-0 rounded-full border border-background/20 shadow-sm'
                        style={{
                          backgroundColor: 'var(--color-havdyp)'
                        }}
                      />
                      <span className='flex-1 text-center'>
                        {commerce.variants[0]?.options.color ??
                          'Havdyp'}
                      </span>
                    </div>
                  </div>

                  <div className='shrink-0'>
                    <span className='mb-2 block font-utekos-text-medium text-xs tracking-normal text-foreground/80'>
                      ANTALL
                    </span>
                    <div className='mt-1 flex h-10 items-center rounded-full border border-background/15 bg-cloud-dancer text-background'>
                      <button
                        type='button'
                        onClick={() => setQuantity(quantity - 1)}
                        className={cn(
                          'flex size-10 items-center justify-center rounded-l-full text-background transition-colors hover:bg-background/5',
                          focusRing
                        )}
                        aria-label='Reduser antall'
                      >
                        <Minus size={17} aria-hidden />
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
                        <Plus size={17} aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-b-lg border-t border-background/20 bg-cloud-dancer p-6 text-background min-[900px]:p-8 min-[1280px]:p-12 md:p-12'>
            <div className='mb-2.5 min-[900px]:mb-3 min-[1280px]:mb-3.5'>
              <BrandBadge
                asChild
                bgColor='var(--primary)'
                fgColor='var(--primary-foreground)'
                className={cn(
                  'hover:bg-primary-hover h-14 min-h-14 w-full min-w-0 px-4 py-0 font-google-sans text-base font-normal leading-none tracking-normal shadow-[0_4px_20px_rgba(255,180,120,0.15)] transition-[transform,filter,box-shadow] hover:text-primary-foreground hover:shadow-[0_4px_25px_rgba(255,180,120,0.3)] hover:brightness-105 active:scale-[0.985] md:h-14 md:min-h-14 md:px-6',
                  (isPending || !isAvailable) &&
                    'cursor-not-allowed opacity-80'
                )}
              >
                <button
                  type='button'
                  onClick={handleAddToCart}
                  data-track='SkreddersyVarmenAddToCartClick'
                  disabled={isPending || !isAvailable}
                  aria-busy={isAddToCartPending}
                  className={cn(
                    'flex w-full min-w-0 items-center justify-center gap-2 text-center',
                    focusRing
                  )}
                >
                  {isAddToCartPending ?
                    <Loader2
                      className='size-5 animate-spin'
                      aria-hidden
                    />
                  : <ShoppingCart
                      className='size-5 shrink-0'
                      aria-hidden
                    />
                  }
                  <span className='font-medium whitespace-nowrap'>
                    {isAddToCartPending ?
                      'Legger i handlekurv'
                    : isAvailable ?
                      'Legg i handlekurv'
                    : 'Utsolgt'}
                  </span>
                  {currentPrice && isAvailable ?
                    <>
                      <span className='hidden h-5 w-px bg-background/20 sm:block' />
                      <span className='hidden font-google-sans font-medium whitespace-nowrap sm:inline'>
                        {formatPrice({
                          amount: String(
                            Number(currentPrice.amount) *
                              quantity
                          ),
                          currencyCode: currentPrice.currencyCode
                        })}
                      </span>
                    </>
                  : null}
                </button>
              </BrandBadge>
            </div>

            <KlarnaLandingExpressCheckout
              product={shopifyProduct}
              selectedVariant={selectedShopifyVariant}
              quantity={quantity}
              className='mb-4 min-[900px]:mb-6 min-[1280px]:mb-8'
            />


            <ShippingAndReturnComponent />
          </div>
        </div>
      </section>

      <ProductDetailsAccordion selectedModel='utekos-techdown' />
    </>
  )
}
