import type { Metadata } from 'next'
import { buildMissingProductMetadata } from './buildMissingProductMetadata'
import { buildProductMetadata } from './buildProductMetadata'
import { getCachedProductForMetadata } from './getCachedProductForMetadata'
import { SITE_URL } from './siteUrl'
import { toAbsoluteUrl } from './toAbsoluteUrl'
import { getProductPresentation } from '@/lib/products/presentation'
import type { ProductPresentation } from '@/lib/products/presentation'

function buildProductPresentationMetadata(
  presentation: ProductPresentation
): Metadata {
  const imageUrl = toAbsoluteUrl(
    '/og-image-utekos-produkter.jpg'
  )

  return {
    metadataBase: new URL(SITE_URL),
    title: presentation.displayName,
    description: presentation.description,
    alternates: { canonical: presentation.canonicalPath },
    openGraph: {
      type: 'website',
      locale: 'no_NO',
      url: toAbsoluteUrl(presentation.canonicalPath),
      siteName: 'Utekos',
      title: presentation.displayName,
      description: presentation.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: presentation.media.defaultAlt
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: presentation.displayName,
      description: presentation.description,
      images: [imageUrl]
    }
  }
}

type GenerateProductMetadataDependencies = {
  loadProduct?: typeof getCachedProductForMetadata
}

export async function generateProductMetadata(
  handle: string,
  dependencies: GenerateProductMetadataDependencies = {}
): Promise<Metadata> {
  const presentation = getProductPresentation(handle)

  if (!presentation) {
    return buildMissingProductMetadata()
  }

  let product

  try {
    product = await (
      dependencies.loadProduct ?? getCachedProductForMetadata
    )(presentation.storefrontLookupHandle)
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'pdp.metadata.served_presentation_fallback',
        level: 'WARN',
        error:
          error instanceof Error ? error.message : String(error),
        context: { handle: presentation.publicHandle }
      })
    )
    return buildProductPresentationMetadata(presentation)
  }

  if (!product) {
    return buildMissingProductMetadata()
  }

  return buildProductMetadata(product, presentation)
}
