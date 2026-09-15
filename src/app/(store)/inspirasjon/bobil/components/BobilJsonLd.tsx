import { cacheLife, cacheTag } from 'next/cache'
import type { CollectionPage, WithContext } from 'schema-dts'
import Script from 'next/script'

export async function BobilJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('jsonld-bobil')

  const jsonLd: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Bobil og Utekos',
    'description': 'Oppdag hvordan Utekos forvandler bobilopplevelsen. Inspirasjon for alle sesonger.',
    'url': 'https://utekos.no/inspirasjon/bobil',
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      'url': 'https://utekos.no/og-image-bobil.jpg'
    },
    'publisher': {
      '@id': 'https://utekos.no/#organization'
    },
    'about': {
      '@type': 'Thing',
      'name': 'Bobil og Utekos'
    },
    'datePublished': '2024-01-15',
    'dateModified': '2026-05-24'
  }

  return (
    <Script id='bobil-json-ld' type='application/ld+json'>
      {`${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}`}
    </Script>
  )
}
