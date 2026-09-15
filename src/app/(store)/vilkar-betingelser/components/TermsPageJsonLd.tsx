import { lastUpdated } from '@/db/config/terms.config'
import { cacheLife, cacheTag } from 'next/cache'
import type { WebPage, WithContext } from 'schema-dts'

export async function TermsPageJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('jsonld-terms')

  const jsonLd: WithContext<WebPage> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Vilkår og betingelser | Utekos',
    'description':
      'Salgsbetingelser for kjøp av varer hos Utekos. Informasjon om betaling, levering, angrerett og reklamasjon.',
    'url': 'https://utekos.no/vilkar-betingelser',
    'inLanguage': 'nb-NO',
    'dateModified': lastUpdated,
    'publisher': {
      '@id': 'https://utekos.no/#organization'
    },
    'about': {
      '@type': 'Thing',
      'name': 'Salgsbetingelser og vilkår'
    }
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
