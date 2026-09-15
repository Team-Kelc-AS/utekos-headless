import { DeferredPurchaseClientLanding } from './DeferredPurchaseClientLanding'
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
  const resolved = searchParams == null ? {} : await searchParams
  return (
    <DeferredPurchaseClientLanding
      initialVariantId={
        resolveCommerceVariantFromSearchParams(
          commerce,
          resolved
        )?.id ?? commerce.defaultVariantId
      }
    />
  )
}
