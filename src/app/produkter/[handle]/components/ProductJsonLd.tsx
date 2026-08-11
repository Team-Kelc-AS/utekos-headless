import { techDownReviews } from '@/app/skreddersy-varmen/data/reviews'
import { getProductCommerceViewModel } from '@/lib/products/commerce'
import { getProductPresentation } from '@/lib/products/presentation'
import { buildProductGroupJsonLd } from '@/lib/products/structured-data/buildProductGroupJsonLd'
import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'

export async function ProductJsonLd({ handle }: { handle: string }) {
  const presentation = getProductPresentation(handle)

  if (!presentation) return null

  const commerce = await getProductCommerceViewModel(
    presentation.publicHandle
  )

  if (!commerce) return null

  const productGroup = buildProductGroupJsonLd(commerce, {
    ...(presentation.productKey === 'utekos-techdown' ?
      {
        reviews: techDownReviews,
        includeAggregateRatingOnly: true
      }
    : {})
  })

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        ...productGroup
      }}
    />
  )
}
