import { PurchaseClientLanding } from './PurchaseClientLanding'
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
  searchParams: Promise<SearchParamsRecord>
}) {
  const resolvedSearchParams = await searchParams

  return (
    <PurchaseClientLanding
      commerce={commerce}
      initialVariantId={
        resolveCommerceVariantFromSearchParams(
          commerce,
          resolvedSearchParams
        )?.commerce.id ?? commerce.defaultVariantId
      }
    />
  )
}
