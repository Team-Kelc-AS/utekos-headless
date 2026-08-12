import { techDownReviews } from '../data/reviews'
import {
  LANDING_BASE_URL,
  LANDING_LAST_UPDATED,
  LANDING_PAGE_URL
} from '../data/landingSeoContent'
import { buildProductGroupJsonLd } from '@/lib/products/structured-data/buildProductGroupJsonLd'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

export function buildSkreddersyVarmenJsonLd(
  commerce: ProductCommerceViewModel
) {
  const productGroup = buildProductGroupJsonLd(commerce, {
    reviews: techDownReviews
  })

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemPage',
        '@id': `${LANDING_PAGE_URL}#webpage`,
        'url': LANDING_PAGE_URL,
        'name': 'Utekos TechDown™ | Skreddersy varmen',
        'description':
          'Opplev kompromissløs komfort og overlegen allsidighet. Tilpass lengde, reguler ventilasjon og skreddersy passform. Juster, form og nyt.',
        'inLanguage': 'nb-NO',
        'dateModified': LANDING_LAST_UPDATED,
        'isPartOf': { '@id': `${LANDING_BASE_URL}/#website` },
        'publisher': {
          '@id': `${LANDING_BASE_URL}/#organization`
        },
        'breadcrumb': {
          '@id': `${LANDING_PAGE_URL}#breadcrumb`
        },
        'mainEntity': { '@id': commerce.productGroupUrl }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${LANDING_PAGE_URL}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Forsiden',
            'item': LANDING_BASE_URL
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Skreddersy varmen',
            'item': LANDING_PAGE_URL
          }
        ]
      },
      productGroup
    ]
  }
}
