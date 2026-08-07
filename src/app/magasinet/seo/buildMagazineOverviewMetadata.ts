// Path: src/app/magasinet/seo/buildMagazineOverviewMetadata.ts

import type { Metadata } from 'next'
import { SITE_URL } from '@/constants'

const MAGAZINE_PATH = '/magasinet'
const MAGAZINE_URL = `${SITE_URL}${MAGAZINE_PATH}`

const title = 'Magasinet | Utekos'
const description =
  'Les inspirasjon, guider og råd fra Utekos om hytteliv, terrasseliv, båtliv, bobilliv og varme komfortplagg for gode stunder ute.'

const imageUrl = `${SITE_URL}/og-image-utekos-magasinet.jpg`

export function buildMagazineOverviewMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical: MAGAZINE_PATH
    },
    openGraph: {
      type: 'website',
      locale: 'no_NO',
      url: MAGAZINE_URL,
      siteName: 'Utekos',
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'Utekos Magasinet'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl]
    }
  }
}
