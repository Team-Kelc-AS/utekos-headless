// Path: src/app/(store)/magasinet/seo/buildArticleJsonLd.ts

import type { BlogPosting, WithContext } from 'schema-dts'
import type { MagazineArticle } from '../types'
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl'
import { SITE_URL } from '@/constants'

export function buildArticleJsonLd(article: MagazineArticle): WithContext<BlogPosting> {
  const articleUrl = `${SITE_URL}/magasinet/${article.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${articleUrl}#article`,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    'headline': article.title,
    'description': article.excerpt,
    'image': [toAbsoluteUrl(article.heroImage.src)],
    'datePublished': article.publishedAt,
    'dateModified': article.updatedAt,
    'author': {
      '@type': article.author ? 'Person' : 'Organization',
      'name': article.author?.name ?? 'Utekos',
      'url': SITE_URL
    },
    'publisher': {
      '@id': `${SITE_URL}/#organization`
    },
    'isAccessibleForFree': true
  }
}
