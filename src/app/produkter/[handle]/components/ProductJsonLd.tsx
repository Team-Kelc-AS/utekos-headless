import { techDownReviews } from '@/app/skreddersy-varmen/data/reviews'
import { getProductCommerceViewModel } from '@/lib/products/commerce'
import { getProductPresentation } from '@/lib/products/presentation'
import { buildProductPageJsonLd } from '@/lib/products/structured-data/buildProductPageJsonLd'
import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'

export async function ProductJsonLd({ handle }: { handle: string }) {
  const presentation = getProductPresentation(handle)

  if (!presentation) return null

  const commerce = await getProductCommerceViewModel(
    presentation.publicHandle
  )

  if (!commerce) return null

  const productPage = buildProductPageJsonLd(commerce, {
    ...(presentation.productKey === 'utekos-techdown' ?
      {
        reviews: techDownReviews,
        includeAggregateRatingOnly: true
      }
    : {})
  })

  return <JsonLdScript data={productPage} />
}
