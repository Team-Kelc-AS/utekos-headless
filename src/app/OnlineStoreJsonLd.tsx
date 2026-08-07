// Path: src/app/OrganizationJsonLd.tsx

import type { OnlineStore, WithContext } from 'schema-dts'
import { cacheLife } from 'next/cache'

export async function OnlineStoreJsonLd() {
  'use cache'
  cacheLife('max')

  const jsonLd: WithContext<OnlineStore> = {
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
      'https://no.pinterest.com/utekosoffisiell/',
      'https://x.com/UtekosOffisiell'
    ],
    'description':
      'Utekos er en merkevare som designer funksjonelt yttertøy for kompromissløs komfort og overlegen allsidighet: Hytteliv, bobilferie, telttur, båt og terrasseliv.',
    'logo': 'https://utekos.no/logo.png',
    'image': 'https://utekos.no/og-image-utekos-produkter.jpg',
    'foundingDate': '2020',
    'email': 'kundeservice@utekos.no',
    'telephone': '+47 40 21 63 43',
    'vatID': 'NO 925 820 393 MVA',
    'iso6523Code': '0192:925820393',
    'knowsLanguage': 'no',
    'areaServed': {
      '@type': 'Country',
      'name': 'Norway'
    },
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

    'makesOffer': {
      '@type': 'Offer',
      'shippingDetails': {
        '@type': 'OfferShippingDetails',
        'shippingDestination': {
          '@type': 'DefinedRegion',
          'addressCountry': 'NO'
        },
        'shippingRate': {
          '@type': 'MonetaryAmount',
          'value': 0,
          'currency': 'NOK'
        }
      }
    },
    'hasMerchantReturnPolicy': {
      '@type': 'MerchantReturnPolicy',
      'applicableCountry': 'NO',
      'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
      'merchantReturnDays': 14,
      'returnMethod': 'https://schema.org/ReturnByMail',
      'url': 'https://utekos.no/frakt-og-retur'
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
