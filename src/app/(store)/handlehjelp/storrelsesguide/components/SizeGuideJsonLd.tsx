import { cacheLife, cacheTag } from 'next/cache'
import { SITE_URL } from '@/constants'
import { techDownFaq } from '../utils/techDownFaq'
import type {
  BreadcrumbList,
  FAQPage,
  Graph,
  WebPage
} from 'schema-dts'

const PAGE_URL = `${SITE_URL}/handlehjelp/storrelsesguide`
const WEBSITE_ID = `${SITE_URL}/#website`
const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBPAGE_ID = `${PAGE_URL}#webpage`
const BREADCRUMB_ID = `${PAGE_URL}#breadcrumb`
const FAQ_ID = `${PAGE_URL}#faq`

export async function SizeGuideJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('jsonld-size-guide')

  const webPage: WebPage = {
    '@type': 'WebPage',
    '@id': WEBPAGE_ID,
    'url': PAGE_URL,
    'name': 'Størrelsesguide for Utekos',
    'description':
      'Størrelsesguide for Utekos TechDown, Dun, Mikrofiber og Comfyrobe med plaggmål, måleveiledning og råd for riktig passform.',
    'inLanguage': 'nb-NO',
    'isPartOf': { '@id': WEBSITE_ID },
    'breadcrumb': { '@id': BREADCRUMB_ID },
    'mainEntity': { '@id': FAQ_ID },
    'publisher': { '@id': ORGANIZATION_ID }
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
        'name': 'Størrelsesguide'
      }
    ]
  }

  const faq: FAQPage = {
    '@type': 'FAQPage',
    '@id': FAQ_ID,
    'mainEntityOfPage': { '@id': WEBPAGE_ID },
    'author': { '@id': ORGANIZATION_ID },
    'publisher': { '@id': ORGANIZATION_ID },
    'mainEntity': techDownFaq.map(({ question, answer }) => ({
      '@type': 'Question',
      'name': question,
      'acceptedAnswer': { '@type': 'Answer', 'text': answer }
    }))
  }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [webPage, breadcrumb, faq]
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
