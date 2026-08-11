import { techDownReviews } from '../data/reviews'
import { LANDING_LAST_UPDATED } from '../data/landingSeoContent'
import { buildProductGroupJsonLd } from '@/lib/products/structured-data/buildProductGroupJsonLd'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

const SITE_URL = 'https://utekos.no'
const PAGE_URL = `${SITE_URL}/skreddersy-varmen`

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
        '@id': `${PAGE_URL}#webpage`,
        'url': PAGE_URL,
        'name':
          'Utekos TechDown™ – skreddersy varmen ute | Utekos',
        'description':
          'Oppdag Utekos TechDown™ – et varmt og allsidig 3-i-1-plagg for terrasse, hytte, båt og bobil. Velg størrelse og skreddersy varmen ute.',
        'inLanguage': 'nb-NO',
        'dateModified': LANDING_LAST_UPDATED,
        'isPartOf': {
          '@id': `${SITE_URL}/#website`
        },
        'publisher': {
          '@id': `${SITE_URL}/#organization`
        },
        'breadcrumb': {
          '@id': `${PAGE_URL}#breadcrumb`
        },
        'mainEntity': {
          '@id': commerce.productGroupUrl
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Forsiden',
            'item': SITE_URL
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Skreddersy varmen',
            'item': PAGE_URL
          }
        ]
      },
      productGroup
    ]
  }
}
