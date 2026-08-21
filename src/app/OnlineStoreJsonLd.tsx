// Path: src/app/OrganizationJsonLd.tsx

import type { OnlineStore, WithContext } from 'schema-dts'
import { cacheLife } from 'next/cache'
import { PINTEREST_PROFILE_URL } from '@/lib/merchant-feeds/pinterest/pinterestProfileUrl'
import { merchantReturnPolicyJsonLd } from '@/lib/policies/merchantReturnPolicyJsonLd'
import { merchantShippingServiceJsonLd } from '@/lib/policies/merchantShippingServiceJsonLd'

type OnlineStoreWithShippingService = OnlineStore & {
  hasShippingService: typeof merchantShippingServiceJsonLd
}

export async function OnlineStoreJsonLd() {
  'use cache'
  cacheLife('max')

  const jsonLd: WithContext<OnlineStoreWithShippingService> = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': 'https://utekos.no/#organization',
    'name': 'Utekos',
    'legalName': 'Kelc As',
    'url': 'https://utekos.no',
    'brand': 'Utekos',
    'sameAs': [
      'https://www.facebook.com/utekosen',
      'https://www.instagram.com/utekos.no',
      PINTEREST_PROFILE_URL,
      'https://x.com/UtekosOffisiell'
    ],
    'description':
      'Utekos er en merkevare som designer yttertøy som kan justeres og formes etter behov. Opplev ompromissløs komfort og overlegen allsidighet. Perfekt for hytte, bobil, camping og terrasseliv.',
    'logo': 'https://utekos.no/logo.png',
    'image': 'https://utekos.no/og-image-utekos-produkter.jpg',
    'foundingDate': '2020',
    'email': 'kundeservice@utekos.no',
    'telephone': '+47 40 21 63 43',
    'vatID': 'NO 925 820 393 MVA',
    'iso6523Code': '0192:925820393',
    'knowsLanguage': 'no',
    'areaServed': { '@type': 'Country', 'name': 'Norway' },
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Lille Damsgårdsveien 25',
      'postalCode': '5162',
      'addressLocality': 'Laksevåg',
      'addressCountry': 'NO'
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Customer Service',
      'telephone': '+47 40 21 63 43',
      'email': 'kundeservice@utekos.no',
      'areaServed': 'NO',
      'availableLanguage': 'no'
    },

    'hasShippingService': merchantShippingServiceJsonLd,
    'hasMerchantReturnPolicy': merchantReturnPolicyJsonLd
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
