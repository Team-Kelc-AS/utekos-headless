import { DeferredPurchaseClientLanding } from './DeferredPurchaseClientLanding'
import {
  resolveCommerceVariantFromSearchParams,
  type ProductModel
} from '@/lib/products/commerce'
import { requireProductPresentation } from '@/lib/products/presentation/getProductPresentation'

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
  const resolved = searchParams == null ? {} : await searchParams
  return (
    <DeferredPurchaseClientLanding
      commerce={commerce}
      initialVariantId={
        resolveCommerceVariantFromSearchParams(
          commerce,
          resolved
        )?.id ?? commerce.defaultVariantId
      }
      presentation={requireProductPresentation(commerce.handle)}
    />
  )
}
