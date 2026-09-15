import 'server-only'

import type { BreadcrumbList, Graph, ImageObject, WebPage } from 'schema-dts'

const SITE_URL = 'https://utekos.no'
const PAGE_URL = `${SITE_URL}/produkter`
const WEBPAGE_ID = `${PAGE_URL}#webpage`
const BREADCRUMB_ID = `${PAGE_URL}#breadcrumb`
const PRIMARY_IMAGE_ID = `${PAGE_URL}#primary-image`
const PRIMARY_IMAGE_URL = `${SITE_URL}/kvinne-nyter-terrasselivet-med-utekos-techdown.webp`

export function buildProductOverviewBreadcrumbJsonLd(): Graph {
  const primaryImage: ImageObject = {
    '@type': 'ImageObject',
    '@id': PRIMARY_IMAGE_ID,
    'url': PRIMARY_IMAGE_URL,
    'contentUrl': PRIMARY_IMAGE_URL,
    'caption': 'Kvinne nyter terrasselivet med Utekos TechDown.'
  }

  const breadcrumb: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': BREADCRUMB_ID,
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
        'item': PAGE_URL
      }
    ]
  }

  const webpage: WebPage = {
    '@type': 'WebPage',
    '@id': WEBPAGE_ID,
    'url': PAGE_URL,
    'name': 'Kolleksjonen for kompromissløs komfort | Utekos',
    'description':
      'Utforsk hele kolleksjonen av komfortplagg fra Utekos. Våre varme og slitesterke produkter er skapt for å forlenge de gode stundene på hytten, i bobilen eller på kjølige kvelder.',
    'inLanguage': 'nb-NO',
    'isPartOf': {
      '@id': `${SITE_URL}/#website`
    },
    'about': {
      '@id': `${SITE_URL}/#organization`
    },
    'breadcrumb': {
      '@id': BREADCRUMB_ID
    },
    'primaryImageOfPage': primaryImage
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [webpage, primaryImage, breadcrumb]
  }
}
