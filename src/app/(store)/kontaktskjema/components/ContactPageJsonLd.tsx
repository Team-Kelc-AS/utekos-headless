// Path: src/app/(store)/kontaktskjema/ContactPageJsonLd.tsx
import { cacheLife, cacheTag } from 'next/cache'
import type { BreadcrumbList, ContactPage, Graph } from 'schema-dts'

const breadcrumbNode: BreadcrumbList = {
  '@type': 'BreadcrumbList',
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Forsiden',
      'item': 'https://utekos.no'
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'Kontakt oss',
      'item': 'https://utekos.no/kontaktskjema'
    }
  ]
}

export async function ContactPageJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('contact-page')

  const contactPageNode: ContactPage = {
    '@type': 'ContactPage',
    'name': 'Kontakt oss | Utekos Kundeservice',
    'description':
      'Kundeservice for Utekos. Vi hjelper deg med bestillinger, produktspørsmål og retur.',
    'url': 'https://utekos.no/kontaktskjema',
    'breadcrumb': breadcrumbNode,

    'mainEntity': {
      '@id': 'https://utekos.no/#organization'
    },

    'about': [
      {
        '@id': 'https://utekos.no/#organization'
      },
      {
        '@type': 'Service',
        'name': 'Kundeservice',
        'provider': {
          '@id': 'https://utekos.no/#organization'
        }
      }
    ],

    'significantLink': [
      'https://utekos.no/frakt-og-retur',
      'https://utekos.no/handlehjelp/storrelsesguide',
      'https://utekos.no/handlehjelp/vask-og-vedlikehold'
    ],

    'audience': {
      '@type': 'Audience',
      'audienceType': 'Customers'
    },

    'lastReviewed': '2026-04-17'
  }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [contactPageNode, breadcrumbNode]
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
