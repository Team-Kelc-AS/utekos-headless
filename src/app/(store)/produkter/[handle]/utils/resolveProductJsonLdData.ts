import { techDownReviews } from '@/app/skreddersy-varmen/data/reviews'
import { getProductPresentation } from '@/lib/products/presentation'
import { buildProductGroupJsonLd } from '@/lib/products/structured-data/buildProductGroupJsonLd'

type LoadCommerce =
  (typeof import('@/lib/products/commerce'))['getProductModel']

type ProductJsonLdErrorContext = {
  publicHandle: string
  storefrontLookupHandle: string
}

type ProductJsonLdDependencies = {
  loadCommerce?: LoadCommerce
  onError?: (
    error: unknown,
    context: ProductJsonLdErrorContext
  ) => void
}

async function loadProductCommerce(publicHandle: string) {
  const { getProductModel } =
    await import('@/lib/products/commerce')
  return getProductModel(publicHandle)
}

export async function resolveProductJsonLdData(
  handle: string,
  dependencies: ProductJsonLdDependencies = {}
) {
  const presentation = getProductPresentation(handle)

  if (!presentation) return null

  try {
    const commerce = await (
      dependencies.loadCommerce ?? loadProductCommerce
    )(presentation.publicHandle)

    if (!commerce) return null

    const productGroup = buildProductGroupJsonLd(commerce, {
      ...(presentation.publicHandle === 'utekos-techdown' ?
        {
          reviews: techDownReviews,
          includeAggregateRatingOnly: true
        }
      : {})
    })

    return { '@context': 'https://schema.org', ...productGroup }
  } catch (error) {
    try {
      dependencies.onError?.(error, {
        publicHandle: presentation.publicHandle,
        storefrontLookupHandle: presentation.publicHandle
      })
    } catch {
      // Observability must never make noncritical structured data fatal.
    }
    return null
  }
}
