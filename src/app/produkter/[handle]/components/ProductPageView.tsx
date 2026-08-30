import { Suspense } from 'react'
import { ProductPageAccordion } from '@/app/produkter/[handle]/components/ProductPageAccordion'
import { GalleryColumn } from '@/components/jsx/GalleryColumn'
import { ProductGallery } from '@/components/jsx/ProductGallery'
import { getKlarnaMinorUnitAmount } from '@/components/klarna/utils/getKlarnaMinorUnitAmount'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { OptionsColumn } from '@/components/jsx/OptionsColumn'
import { ProductPageGrid } from '@/components/jsx/ProductPageGrid'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { productMetadata } from '@/db/config/product-metadata.config'
import { getProductPageContent } from '@/db/data/products/product-page-content'
import ProductHeader from './ProductHeader'
import PriceActivityPanel from './PriceActivityPanel'
import { ProductDescription } from './ProductDescription'
import { KlarnaDesktopPromo } from './KlarnaDesktopPromo'
import { AsyncProductPurchaseIsland } from './AsyncProductPurchaseIsland'
import { ProductPurchaseIslandSkeleton } from './ProductPurchaseIslandSkeleton'
import { AsyncRelatedProducts } from './AsyncRelatedProducts'
import { resolveProductGalleryImages } from '../utils/resolveProductGalleryImages'
import type {
  ProductPurchaseModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { Image } from 'types/media'
import { DesktopBreadcrump } from './DesktopBreadcrump'
import { PRODUCT_GALLERY_IMAGE_OVERRIDES } from '../utils/gallery-images/productGalleryImageOverrides'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { SoldOutWaitlistDialog } from '@/components/product-waitlist/SoldOutWaitlistDialog'
import { SmartRealTimeActivity } from './SmartRealTimeActivity'
import { ProductViewItemReporter } from './ProductViewItemReporter'
import { computeVariantImages } from '@/lib/utils/computeVariantImages'
import { COMFYROBE_MOBILE_GALLERY_IMAGES } from '../utils/gallery-images/comfyrobeProductGalleryImages'
import { TECHDOWN_MOBILE_GALLERY_IMAGES } from '../utils/gallery-images/techdown/productGalleryImages'
import { MICROFIBER_MOBILE_GALLERY_IMAGES } from '../utils/gallery-images/mikrofiber/mikrofiberProductGalleryImages'

type ProductPageViewProps = {
  productData: ProductPurchaseModel
  selectedVariant: ProductPurchaseVariant
  storefrontLookupHandle: string
  storefrontSelectedOptions: Array<{
    name: string
    value: string
  }>
}

export function ProductPageView({
  productData,
  selectedVariant,
  storefrontLookupHandle,
  storefrontSelectedOptions
}: ProductPageViewProps) {
  const { title } = productData

  const selectedVariantProfile =
    selectedVariant.variantProfileData

  const productSubtitle =
    typeof selectedVariantProfile?.subtitle === 'string' ?
      selectedVariantProfile.subtitle
    : undefined

  const productPageContent = getProductPageContent(
    productData.handle
  )

  const currentProductMetadata =
    productMetadata[productData.handle]

  const activityNode =
    currentProductMetadata?.showActivity ?
      <SmartRealTimeActivity
        baseViewers={currentProductMetadata.baseViewers ?? 3}
      />
    : undefined

  const overrideImages =
    PRODUCT_GALLERY_IMAGE_OVERRIDES[productData.handle]

  const variantImages = computeVariantImages(
    productData,
    selectedVariant
  )

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

  const mobileGalleryImages =
    productData.handle === 'comfyrobe' ?
      COMFYROBE_MOBILE_GALLERY_IMAGES
    : productData.handle === 'utekos-techdown' ?
      TECHDOWN_MOBILE_GALLERY_IMAGES
    : productData.handle === 'utekos-mikrofiber' ?
      MICROFIBER_MOBILE_GALLERY_IMAGES
    : galleryImages

  const isTechDownProduct =
    productData.handle === 'utekos-techdown'
  const useCompactGallery = galleryImages.length === 1

  const galleryAspectRatio =
    useCompactGallery ? 1
    : isTechDownProduct ? 2 / 3
    : 9 / 16

  const galleryDesktopBleedClassName =
    'md:left-auto md:w-full md:translate-x-0 md:-ml-[calc((100vw-100cqw-4rem)/4)]'

  const galleryFrameClassName =
    useCompactGallery ?
      `mx-auto w-full max-w-lg sm:max-w-xl md:mx-0 md:max-w-none ${galleryDesktopBleedClassName}`
    : `relative left-1/2 w-screen -translate-x-1/2 ${galleryDesktopBleedClassName}`

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
        activityNode={activityNode}
      />
    </div>
  )

  return (
    <article className='dark:bg-dark-background ! relative isolate overflow-x-clip bg-background py-0 text-foreground! md:py-6'>
      <ProductViewItemReporter
        product={productData}
        variant={selectedVariant}
      />

      {productData.handle === 'utekos-dun' ?
        <SoldOutWaitlistDialog />
      : null}

      <KlarnaOnSiteMessagingScript />

      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute top-12 left-[8%] size-80 rounded-full' />
        <div className='absolute right-[8%] bottom-[18%] h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--very-peri)_20%,transparent)_0%,transparent_72%)] blur-3xl' />
      </div>

      <div className='@container container mx-auto px-4 md:px-8'>
        <DesktopBreadcrump
          productTitle={title}
          handle={productData.handle ?? ''}
        />

        <ProductPageGrid>
          <GalleryColumn>
            <div className={galleryStickyClassName}>
              <div className='hidden md:block'>
                <ProductGallery
                  title={title}
                  images={galleryImages}
                  imageLayout='cover-fill'
                  framed
                />
              </div>

              <div className='md:hidden'>
                <AspectRatio
                  ratio={galleryAspectRatio}
                  className='w-full'
                >
                  <div className='relative isolate size-full overflow-hidden'>
                    <ProductGallery
                      title={title}
                      images={mobileGalleryImages}
                      imageLayout={
                        isTechDownProduct ? 'intrinsic' : (
                          'cover-fill'
                        )
                      }
                      {...(useCompactGallery ?
                        {
                          imageBackgroundClassName:
                            'bg-transparent',
                          imageClassName:
                            galleryImageClassName as string
                        }
                      : {})}
                    />
                  </div>
                </AspectRatio>
              </div>
            </div>
          </GalleryColumn>

          <OptionsColumn>
            <div className='mt-2 md:mt-0'>
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

            <Suspense
              fallback={<ProductPurchaseIslandSkeleton />}
            >
              <AsyncProductPurchaseIsland
                product={productData}
                selectedVariant={selectedVariant}
                storefrontLookupHandle={storefrontLookupHandle}
                storefrontSelectedOptions={
                  storefrontSelectedOptions
                }
              />
            </Suspense>

            <ProductDescription
              description={productPageContent?.description}
            />

            <KlarnaDesktopPromo />
          </OptionsColumn>
        </ProductPageGrid>

        <div className='mt-16 sm:mt-24' />

        <ProductPageAccordion
          product={productData}
          sections={productPageContent?.accordion}
          selectedVariant={selectedVariant}
        />

        <Suspense fallback={null}>
          <AsyncRelatedProducts
            handle={storefrontLookupHandle}
          />
        </Suspense>
      </div>
    </article>
  )
}
