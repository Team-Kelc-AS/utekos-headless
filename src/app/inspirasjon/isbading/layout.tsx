import { cacheLife } from 'next/cache'
import Script from 'next/script'
import type { QAPage } from 'schema-dts'

export default async function IceBathingPageJsonLd() {
  'use cache'
  cacheLife('max')

  const IceBathingFAQJsonLd: QAPage = {
    '@type': 'QAPage',
    '@id': 'https://utekos.no/inspirasjon/isbading#faq',
    'mainContentOfPage': {
      '@type': 'WebPageElement',
      '@id': 'https://utekos.no/inspirasjon/isbading#faq'
    }
  }
  return (
    <Script
      id='isbading-faq-json-ld'
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(IceBathingFAQJsonLd).replace(/</g, '\\u003c') }}
    />
  )
}
