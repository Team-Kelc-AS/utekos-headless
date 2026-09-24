import type { Organization } from 'schema-dts'
import { PINTEREST_PROFILE_URL } from '@/lib/merchant-feeds/pinterest/pinterestProfileUrl'

export const ORGANIZATION_ID = 'https://utekos.no/#organization'

/**
 * Explicit Organization identity node. OnlineStore (a subtype) alone is not
 * enough for machine readers that match on the literal `Organization` type,
 * and the homepage graph references this `@id` without defining it.
 */
export function buildOrganizationJsonLd(): Organization {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    'name': 'Utekos',
    'legalName': 'Kelc As',
    'url': 'https://utekos.no',
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
    'sameAs': [
      'https://www.facebook.com/utekosen',
      'https://www.instagram.com/utekos.no',
      PINTEREST_PROFILE_URL,
      'https://x.com/UtekosOffisiell'
    ],
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
    }
  }
}
