import { PurchaseClientLanding } from './PurchaseClientLanding'
import { LandingPageProductCarouselPurchaseSection } from './LandingPageProductCarouselPurchaseSection'
import { LandingPurchaseProductInformation } from './LandingPurchaseProductInformation'
import { ProductDetailsAccordion } from './ProductDetailsAccordion'
import { TechDownSizeGuideAccordion } from './TechDownSizeGuideAccordion'
import { requireProductPresentation } from '@/lib/products/presentation/getProductPresentation'
import {
  resolveCommerceVariantFromSearchParams,
  type ProductCommerceViewModel
} from '@/lib/products/commerce'

type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>

export async function LandingPurchaseSection({
  commerce,
  searchParams
}: {
  commerce: ProductCommerceViewModel
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord
}) {
  const resolvedSearchParams =
    searchParams == null ? {} : await searchParams

  return (
    <PurchaseClientLanding
      commerce={commerce}
      presentation={requireProductPresentation(
        commerce.publicHandle
      )}
      content={{
        gallery: <LandingPageProductCarouselPurchaseSection />,
        productInformation: (
          <LandingPurchaseProductInformation
            modelName={commerce.displayName.replace(
              /^Utekos\s+/u,
              ''
            )}
          />
        ),
        sizeGuide: <TechDownSizeGuideAccordion />,
        productDetails: (
          <ProductDetailsAccordion selectedModel='utekos-techdown' />
        )
      }}
      initialVariantId={
        resolveCommerceVariantFromSearchParams(
          commerce,
          resolvedSearchParams ?? {}
        )?.commerce.id ?? commerce.defaultVariantId
      }
    />
  )
}
