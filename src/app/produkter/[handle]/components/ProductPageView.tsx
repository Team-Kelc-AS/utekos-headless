'use client'
import { Activity, useState } from 'react'
import { ProductPageAccordion } from '@/app/produkter/[handle]/components/ProductPageAccordion'
import { renderOptionComponent } from '@/app/produkter/[handle]/utils/renderOptionComponent'
import { RelatedProducts } from '@/app/produkter/[handle]/components/RelatedProducts'
import { AddToCart } from '@/components/cart/AddToCart'
import { GalleryColumn } from '@/components/jsx/GalleryColumn'
import { getKlarnaMinorUnitAmount } from '@/components/klarna/utils/getKlarnaMinorUnitAmount'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { OptionsColumn } from '@/components/jsx/OptionsColumn'
import { ProductPageGrid } from '@/components/jsx/ProductPageGrid'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { productMetadata } from '@/db/config/product-metadata.config'
import { getProductPageContent } from '@/db/data/products/product-page-content'
import { getSortedOptions } from '@/lib/helpers/async/getSortedOptions'
import dynamic from 'next/dynamic'
import ProductHeader from './ProductHeader'
import ProductGalleryCard from './ProductGalleryCard'
import PriceActivityPanel from './PriceActivityPanel'
import { ProductDescription } from './ProductDescription'
import { KlarnaDesktopPromo } from './KlarnaDesktopPromo'
import { TrustSignals } from './TrustSignals'
import { resolveProductGalleryImages } from '../utils/resolveProductGalleryImages'
import { STOCK_THRESHOLD } from '../utils/resolveProductGalleryImages'
import type { ProductPageViewProps } from 'types/product/PageProps'
import type { ShopifyProduct } from 'types/product'
import type { Image } from 'types/media'
import { DesktopBreadcrump } from './DesktopBreadcrump'
import { PRODUCT_GALLERY_IMAGE_OVERRIDES } from '../utils/gallery-images/productGalleryImageOverrides'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ProductGalleryGrid } from './ProductGalleryGrid'
import { SoldOutWaitlistDialog } from '@/components/product-waitlist/SoldOutWaitlistDialog'

const SmartRealTimeActivity = dynamic(
  () =>
    import('@/app/produkter/[handle]/components/SmartRealTimeActivity').then(
      mod => mod.SmartRealTimeActivity
    ),
  { ssr: false, loading: () => <div className='h-6' /> }
)

const ProductGallery = dynamic(
  () =>
    import('@/components/jsx/ProductGallery').then(
      mod => mod.ProductGallery
    ),
  {
    loading: () => (
      <div className='relative aspect-9/16 w-full overflow-hidden rounded-none' />
    ),
    ssr: false
  }
)

export function ProductPageView({
  productData,
  selectedVariant,
  allVariants,
  variantImages,
  onOptionChange,
  relatedProducts,
  colorHexMap,
  productOptions,
  isVariantNavigationPending,
  hasVariantSelectionError
}: ProductPageViewProps) {
  const [additionalLine] = useState<
    { variantId: string; quantity: number } | undefined
  >(undefined)

  const { title, options } = productData
  const selectedVariantProfile =
    selectedVariant.variantProfileData
  const productSubtitle =
    typeof selectedVariantProfile?.subtitle === 'string' ?
      selectedVariantProfile.subtitle
    : undefined
  const productPageContent = getProductPageContent(
    productData.handle
  )

  const optionOrderPreference = ['Størrelse', 'Farge']
  const sortedProductOptions = getSortedOptions(
    options,
    optionOrderPreference
  )

  const currentProductMetadata =
    productMetadata[productData.handle]

  const activityNode =
    currentProductMetadata?.showActivity ?
      <SmartRealTimeActivity
        baseViewers={currentProductMetadata.baseViewers ?? 3}
      />
    : undefined

  const quantity = productData.totalInventory ?? 0
  const limitedStockCount =
    quantity > 0 && quantity < STOCK_THRESHOLD ?
      quantity
    : undefined

  const overrideImages =
    PRODUCT_GALLERY_IMAGE_OVERRIDES[productData.handle]
  const fallbackGalleryImages = variantImages.map(
    (image: Image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText ?? '',
      width: image.width ?? 0,
      height: image.height ?? 0
    })
  )
  const galleryImages = resolveProductGalleryImages(
    overrideImages,
    fallbackGalleryImages
  )
  const useDesktopGrid = galleryImages.length >= 6
  const useCompactGallery = galleryImages.length === 1
  const galleryAspectRatio = useCompactGallery ? 1 : 9 / 16
  const galleryFrameClassName =
    useCompactGallery ?
      'mx-auto w-full max-w-lg sm:max-w-xl md:max-w-lg lg:max-w-xl'
    : 'relative left-1/2 w-screen -translate-x-1/2 md:left-auto md:w-full md:translate-x-0'
  const galleryStickyClassName = `${galleryFrameClassName} md:sticky md:top-24 lg:top-20`
  const galleryImageClassName =
    useCompactGallery ?
      'object-contain object-center p-6 sm:p-8 md:p-10'
    : undefined

  const klarnaPurchaseAmount =
    getKlarnaMinorUnitAmount({
      amount: selectedVariant.price.amount ?? '0',
      currencyCode: selectedVariant.price.currencyCode
    }) ?? ''

  const priceActivityPanel = (
    <div className='! relative mt-2 pt-0 text-foreground! md:mt-0 md:pt-2'>
      <PriceActivityPanel
        productHandle={productData.handle}
        priceAmount={selectedVariant.price.amount ?? '0'}
        currencyCode={selectedVariant.price.currencyCode}
        limitedStockCount={
          limitedStockCount ? limitedStockCount : 0
        }
        activityNode={activityNode}
      />
    </div>
  )

  return (
    <article className='dark:bg-dark-background ! relative isolate overflow-x-clip bg-background py-0 text-foreground! md:py-6'>
      {productData.handle === 'utekos-dun' ?
        <SoldOutWaitlistDialog />
      : null}
      <KlarnaOnSiteMessagingScript />
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute top-12 left-[8%] size-80 rounded-full' />
        <div className='absolute right-[8%] bottom-[18%] h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--very-peri)_20%,transparent)_0%,transparent_72%)] blur-3xl' />
      </div>

      <div className='container mx-auto px-4 md:px-8'>
        <DesktopBreadcrump
          productTitle={title}
          handle={productData.handle ?? ''}
        />

        <ProductPageGrid>
          <GalleryColumn>
            <div className={galleryStickyClassName}>
              <AspectRatio
                ratio={galleryAspectRatio}
                className='w-full'
              >
                <ProductGalleryCard
                  galleryContent={
                    <div className='relative isolate size-full overflow-hidden rounded-none md:rounded-3xl'>
                      {useDesktopGrid ?
                        <>
                          <div className='hidden size-full md:block'>
                            <ProductGalleryGrid
                              title={title}
                              images={galleryImages}
                            />
                          </div>
                          <div className='size-full md:hidden'>
                            <ProductGallery
                              title={title}
                              images={galleryImages}
                            />
                          </div>
                        </>
                      : <ProductGallery
                          title={title}
                          images={galleryImages}
                          {...(useCompactGallery ?
                            {
                              imageBackgroundClassName:
                                'bg-transparent',
                              imageClassName:
                                galleryImageClassName as string
                            }
                          : {})}
                        />
                      }
                    </div>
                  }
                  hasIntegratedBackground
                  integratedBackgroundSize={
                    useCompactGallery ? 'compact' : 'wide'
                  }
                  flushOnMobile={!useCompactGallery}
                  enableStickyOnDesktop={false}
                  ariaLabel='Produktgalleri'
                />
              </AspectRatio>
            </div>
            <AnimatedBlock
              className='will-animate-fade-in-up mt-6 md:hidden'
              delay='0s'
              threshold={0.2}
            >
              <ProductHeader
                product={productData}
                selectedVariant={selectedVariant}
                productHandle={productData.handle}
                productTitle={title}
                productSubtitle={productSubtitle ?? ''}
              />
            </AnimatedBlock>
          </GalleryColumn>
          <OptionsColumn>
            <div className='dark:text-dark-background hidden text-background md:block'>
              <ProductHeader
                product={productData}
                selectedVariant={selectedVariant}
                productHandle={productData.handle}
                productTitle={title}
                productSubtitle={productSubtitle ?? ''}
              />
            </div>

            <AnimatedBlock
              className='will-animate-fade-in-right'
              delay='0.1s'
            >
              {priceActivityPanel}
            </AnimatedBlock>

            <AnimatedBlock
              className='will-animate-fade-in-right'
              delay='0.13s'
            >
              <div
                role='region'
                aria-label='Betalingsinformasjon fra Klarna'
                className='mt-4 overflow-hidden'
              >
                <KlarnaCreditPromotionAutoSize
                  id={`klarna-credit-promotion-${productData.handle}`}
                  purchaseAmount={klarnaPurchaseAmount}
                  theme='default'
                />
              </div>
            </AnimatedBlock>

            <AnimatedBlock
              className='will-animate-fade-in-right'
              delay='0.16s'
            >
              <article
                aria-labelledby='product-options'
                aria-busy={isVariantNavigationPending}
              >
                <h2 id='product-options' className='sr-only'>
                  Produktvalg
                </h2>
                <div className='mt-5 flex flex-col gap-8'>
                  {sortedProductOptions.map(
                    (
                      productOption: ShopifyProduct['options'][number]
                    ) =>
                      renderOptionComponent({
                        option: productOption,
                        allVariants,
                        selectedVariant,
                        onOptionChange,
                        colorHexMap,
                        productHandle: productData.handle,
                        productOptions,
                        isVariantNavigationPending,
                        hasVariantSelectionError
                      })
                  )}
                </div>
                <div
                  className='mt-3 min-h-5 text-sm text-foreground/72'
                  role={
                    hasVariantSelectionError ? 'alert' : 'status'
                  }
                  aria-live='polite'
                >
                  {hasVariantSelectionError ?
                    'Variantvalg er midlertidig utilgjengelig. Oppdater siden for å prøve igjen.'
                  : isVariantNavigationPending ?
                    'Oppdaterer variant…'
                  : null}
                </div>
                <TrustSignals />
                <div className='mt-8 flex flex-col gap-4'>
                  <Activity>
                    <AddToCart
                      product={productData}
                      selectedVariant={selectedVariant}
                      isSelectionPending={
                        isVariantNavigationPending ||
                        hasVariantSelectionError
                      }
                      {...(additionalLine && { additionalLine })}
                    />
                  </Activity>
                </div>

                <ProductDescription
                  description={productPageContent?.description}
                />
                <KlarnaDesktopPromo />
              </article>
            </AnimatedBlock>
          </OptionsColumn>
        </ProductPageGrid>

        <div className='mt-16 sm:mt-24'></div>
        <ProductPageAccordion
          product={productData}
          sections={productPageContent?.accordion}
          selectedVariant={selectedVariant}
        />
        {relatedProducts && relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} />
        )}
      </div>
    </article>
  )
}
