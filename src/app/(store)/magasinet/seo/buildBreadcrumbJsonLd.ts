// src/app/(store)/magasinet/_seo/buildBreadcrumbJsonLd.ts

import type { BreadcrumbList, WithContext } from 'schema-dts'
import type { MagazineArticle } from '../types'
import { SITE_URL } from '@/constants'

export function buildBreadcrumbJsonLd(article: MagazineArticle): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Magasinet',
        'item': `${SITE_URL}/magasinet`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': article.title,
        'item': `${SITE_URL}/magasinet/${article.slug}`
      }
    ]
  }
}
