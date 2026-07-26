import { lastUpdatedIso } from '@/db/config/privacy.config'
import { cacheLife, cacheTag } from 'next/cache'
import type { WebPage, WithContext } from 'schema-dts'

export async function PrivacyPolicyJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('privacy-policy-jsonld')

  const jsonLd: WithContext<WebPage> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Personvernerklæring | Utekos',
    'description':
      'Juridisk informasjon om hvordan Utekos samler inn, bruker og beskytter dine personopplysninger i henhold til GDPR.',
    'url': 'https://utekos.no/personvern',
    'inLanguage': 'nb-NO',
    'dateModified': lastUpdatedIso,
    'publisher': {
      '@id': 'https://utekos.no/#organization'
    },
    'about': {
      '@type': 'Thing',
      'name': 'Personvern og GDPR'
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
