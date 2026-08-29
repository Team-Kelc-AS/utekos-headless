import SkreddersyVarmenDocument from '../SkreddersyVarmenDocument.mdx'
import { resolveSkreddersyVarmenCommerce } from '../data/resolveSkreddersyVarmenCommerce'
import type { SkreddersyVarmenPageContent } from '../data/skreddersyVarmenPageModel'

export type LandingSearchParams = Promise<
  Record<string, string | string[] | undefined>
>

export async function SkreddersyVarmenPageRuntime({
  content,
  searchParams
}: {
  content: SkreddersyVarmenPageContent
  searchParams: LandingSearchParams
}) {
  const commerce = await resolveSkreddersyVarmenCommerce()
  const defaultVariant = commerce?.variants.find(
    variant => variant.commerce.id === commerce.defaultVariantId
  )
  const stickyActionProps =
    defaultVariant ?
      {
        price: defaultVariant.commerce.price,
        availableForSale:
          defaultVariant.commerce.availableForSale
      }
    : {}

  return (
    <SkreddersyVarmenDocument
      commerce={commerce}
      content={content}
      searchParams={searchParams}
      stickyActionProps={stickyActionProps}
    />
  )
}
