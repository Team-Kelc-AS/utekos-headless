// src/app/(store)/magasinet/_seo/buildArticleMetadata.ts

import { SITE_URL } from '@/constants'
import type { Metadata } from 'next'
import type { MagazineArticle } from '../types'
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl'

export function buildArticleMetadata(article: MagazineArticle): Metadata {
  const url = `${SITE_URL}/magasinet/${article.slug}`
  const title = article.seo?.title ?? `${article.title} | Utekos Magasinet`
  const description = article.seo?.description ?? article.excerpt
  const imageUrl = toAbsoluteUrl(article.heroImage.src)

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: 'article',
      locale: 'no_NO',
      url,
      siteName: 'Utekos',
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: article.heroImage.width,
          height: article.heroImage.height,
          alt: article.heroImage.alt
        }
      ],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl]
    }
  }
}
