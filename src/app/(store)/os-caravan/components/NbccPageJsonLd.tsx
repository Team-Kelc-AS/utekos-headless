import type { BreadcrumbList, FAQPage, Graph, WebPage } from 'schema-dts'
import { cacheLife } from 'next/cache'

import { NBCC_URL, ORGANIZATION_ID, SITE_URL, WEBSITE_ID } from '../constants'
import { nbccFaqItems } from '../utils/nbccLandingPageContent'

export async function NbccPageJsonLd() {
  'use cache'
  cacheLife('max')

  const webpageNode: WebPage = {
    '@type': 'WebPage',
    '@id': `${NBCC_URL}#webpage`,
    'url': NBCC_URL,
    'name': 'NBCC-medlemsfordel hos Utekos',
    'description':
      'Partnerlandingsside for NBCC-medlemmer med Utekos-produkter for camping, bobil, caravan, fortelt og kjølige kvelder ute.',
    'inLanguage': 'nb-NO',
    'isPartOf': {
      '@id': WEBSITE_ID
    },
    'about': {
      '@id': ORGANIZATION_ID
    },
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      'url': `${SITE_URL}/og-utekos-nbcc-1200x630.jpg`,
      'width': '1200',
      'height': '630',
      'caption': 'NBCC-medlemsfordel hos Utekos'
    }
  }

  const faqNode: FAQPage = {
    '@type': 'FAQPage',
    '@id': `${NBCC_URL}#faq`,
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
    '@id': `${NBCC_URL}#breadcrumb`,
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
        'name': 'NBCC',
        'item': NBCC_URL
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
