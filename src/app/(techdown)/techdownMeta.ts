import type { Metadata } from 'next'
import type { PublicTechDownSize } from '@/lib/products/techDownSizes'
import { resolveMetaCatalogProductId } from '@/lib/analytics/metaCatalogIdentity'

export const TECHDOWN_CANONICAL_URL =
  'https://utekos.no/produkter/utekos-techdown'
export const TECHDOWN_META_PRODUCT_CATALOG_ID = '690208780604782'

export const TECHDOWN_META_CONTENT_ID_BY_SIZE = {
  Middels: '46944403882232',
  Stor: '46944403915000',
  Større: '48249962135800'
} as const satisfies Record<PublicTechDownSize, string>

export function requireTechdownMetaContentId(
  size: PublicTechDownSize,
  shopifyVariantId: string
) {
  const contentId = resolveMetaCatalogProductId(shopifyVariantId)
  const expectedContentId = TECHDOWN_META_CONTENT_ID_BY_SIZE[size]

  if (contentId !== expectedContentId) {
    throw new Error(
      `TechDown Meta catalog identity mismatch for ${size}: expected ${expectedContentId}, received ${contentId}`
    )
  }

  return contentId
}

export const techdownMetadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Utekos TechDown™ Havdyp',
  description:
    'Utekos TechDown™ Havdyp er en lang, marineblå unisex ytterjakke for rolige stunder ute og hjemme.',
  alternates: {
    canonical: TECHDOWN_CANONICAL_URL
  },
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    url: TECHDOWN_CANONICAL_URL,
    siteName: 'Utekos',
    title: 'Utekos TechDown™ Havdyp',
    description:
      'En lang, marineblå unisex ytterjakke for rolige stunder ute og hjemme.',
    images: [
      {
        url: '/TechDown_32.jpg',
        width: 2200,
        height: 1467,
        alt: 'To personer i marineblå Utekos TechDown™ i hengekøyer i skogen.'
      }
    ]
  }
}
