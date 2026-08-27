import type { ProductCommerceViewModel } from '@/lib/products/commerce'
import {
  buildProductGroupJsonLd,
  type ProductReviewPresentation
} from './buildProductGroupJsonLd'

type BuildProductPageJsonLdOptions = {
  reviews?: readonly ProductReviewPresentation[]
  includeAggregateRatingOnly?: boolean
}

const SITE_URL = 'https://utekos.no'
const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

export function buildProductPageJsonLd(
  model: ProductCommerceViewModel,
  options: BuildProductPageJsonLdOptions = {}
) {
  const breadcrumbId = `${model.canonicalUrl}#breadcrumb`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemPage',
        '@id': `${model.canonicalUrl}#webpage`,
        'url': model.canonicalUrl,
        'name': model.displayName,
        'description': model.description,
        'inLanguage': 'nb-NO',
        'dateModified': model.updatedAt,
        'isPartOf': { '@id': WEBSITE_ID },
        'publisher': { '@id': ORGANIZATION_ID },
        'breadcrumb': { '@id': breadcrumbId },
        'mainEntity': { '@id': model.productGroupUrl }
      },
      buildProductGroupJsonLd(model, options),
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
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
            'name': 'Produkter',
            'item': `${SITE_URL}/produkter`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': model.displayName,
            'item': model.canonicalUrl
          }
        ]
      }
    ]
  }
}
