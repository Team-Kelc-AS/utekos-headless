import type { Article, WithContext } from 'schema-dts'
import Script from 'next/script'
import { cacheLife, cacheTag } from 'next/cache'


export const BoatingInspirationJsonLd: WithContext<Article> = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Båtliv og Utekos: Din guide til ultimat komfort på sjøen',
  'description':
    'En komplett guide til hvordan Utekos-plagg maksimerer komforten om bord, uansett vær. Tips og inspirasjon for den norske båteieren.',
  'author': {
    '@type': 'Organization',
    'name': 'Utekos'
  },
  'publisher': {
    '@type': 'Organization',
    'name': 'Utekos',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://utekos.no/logo.png'
    }
  },
  'datePublished': '2026-06-30',
  'dateModified': '2026-06-30',
  'mainEntityOfPage': {
    '@type': 'WebPage',
    '@id': 'https://utekos.no/inspirasjon/boating-inspiration'
  }
}
export async function BoatingInspirationJsonLdScript() {
  'use cache'
  cacheLife('max')
  cacheTag('jsonld-boating-inspiration')

  return (
  <Script id='batliv-json-ld' type='application/ld+json'>
      {`${JSON.stringify(BoatingInspirationJsonLd).replace(/</g, '\\u003c')}`}
    </Script>
  )
}