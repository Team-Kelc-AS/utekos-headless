// Path: src/app/produkter/Bhandle/utils/buildProductMetadata.ts

import type { Metadata } from 'next'
import type { ShopifyProduct } from 'types/product'
import { SITE_URL } from './siteUrl'
import { getProductDisplayImage } from './getProductDisplayImage'
import { cleanText } from './cleanText'
import { toAbsoluteUrl } from './toAbsoluteUrl'
import { buildProductOtherMetadata } from './buildProductOtherMetadata'
import type { ProductPresentation } from '@/lib/products/presentation'

export function buildProductMetadata(
  product: ShopifyProduct,
  presentation: ProductPresentation
): Metadata {
  const canonicalPath = presentation.canonicalPath
  const canonicalUrl = toAbsoluteUrl(canonicalPath)

  const title = presentation.displayName
  const description = presentation.description

  const displayImage = getProductDisplayImage(product)
  const displayImageUrl = toAbsoluteUrl(displayImage?.url || '/og-image.jpg')

  const imageAlt =
    cleanText(presentation.media.defaultAlt) || title

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: 'website',
      locale: 'no_NO',
      url: canonicalUrl,
      siteName: 'Utekos',
      title,
      description,
      images: [
        {
          url: displayImageUrl,
          width: displayImage?.width || 1200,
          height: displayImage?.height || 630,
          alt: imageAlt
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [displayImageUrl]
    },
    other: buildProductOtherMetadata(product)
  }
}
