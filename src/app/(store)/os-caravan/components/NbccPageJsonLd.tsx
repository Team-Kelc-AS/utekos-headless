import type { BreadcrumbList, FAQPage, Graph, WebPage } from 'schema-dts'
import { cacheLife } from 'next/cache'

import {
  ORGANIZATION_ID,
  OS_CARAVAN_URL,
  SITE_URL,
  WEBSITE_ID
} from '../constants'
import { nbccFaqItems } from '../utils/nbccLandingPageContent'

export async function NbccPageJsonLd() {
  'use cache'
  cacheLife('max')

  const webpageNode: WebPage = {
    '@type': 'WebPage',
    '@id': `${OS_CARAVAN_URL}#webpage`,
    'url': OS_CARAVAN_URL,
    'name': 'Eventyrdager hos Os Caravan & Fritid AS',
    'description':
      'Møt Utekos under Eventyrdagene hos Os Caravan & Fritid AS. Se bobiler og campingvogner, og sikre deg Utekos til eksklusiv messepris.',
    'inLanguage': 'nb-NO',
    'isPartOf': {
      '@id': WEBSITE_ID
    },
    'about': {
      '@id': ORGANIZATION_ID
    },
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      'url': `${SITE_URL}/Eventyrdager.webp`,
      'caption': 'Eventyrdager hos Os Caravan & Fritid AS'
    }
  }

  const faqNode: FAQPage = {
    '@type': 'FAQPage',
    '@id': `${OS_CARAVAN_URL}#faq`,
    'mainEntity': nbccFaqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  }

  const breadcrumbNode: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': `${OS_CARAVAN_URL}#breadcrumb`,
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
        'name': 'Os Caravan & Fritid',
        'item': OS_CARAVAN_URL
      }
    ]
  }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [webpageNode, faqNode, breadcrumbNode]
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
      }}
    />
  )
}
