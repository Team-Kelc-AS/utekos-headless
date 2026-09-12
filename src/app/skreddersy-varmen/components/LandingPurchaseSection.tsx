import { DeferredPurchaseClientLanding } from './DeferredPurchaseClientLanding'
import { LandingPageProductCarouselPurchaseSection } from './LandingPageProductCarouselPurchaseSection'
import { LandingPurchaseProductInformation } from './LandingPurchaseProductInformation'
import { ProductDetailsAccordion } from './ProductDetailsAccordion'
import { TechDownSizeGuideAccordion } from './TechDownSizeGuideAccordion'
import { requireProductPresentation } from '@/lib/products/presentation/getProductPresentation'
import {
  resolveCommerceVariantFromSearchParams,
  type ProductModel
} from '@/lib/products/commerce'

type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>

export async function LandingPurchaseSection({
  commerce,
  searchParams
}: {
  commerce: ProductModel
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord
}) {
  const resolvedSearchParams =
    searchParams == null ? {} : await searchParams

  return (
    <DeferredPurchaseClientLanding
      commerce={commerce}
      presentation={requireProductPresentation(commerce.handle)}
      content={{
        gallery: <LandingPageProductCarouselPurchaseSection />,
        productInformation: (
          <LandingPurchaseProductInformation
            modelName={commerce.title.replace(/^Utekos\s+/u, '')}
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
        )?.id ?? commerce.defaultVariantId
      }
    />
  )
}
