import type { Article, WithContext } from 'schema-dts'

export const jsonLd: WithContext<Article> = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Den Perfekte Grillkvelden: En guide til varme og hygge',
  'description':
    'Lær hvordan du bruker Utekos til å forlenge grillkvelden og sikre at gjestene dine er komfortable, slik at de gode øyeblikkene kan vare lenger.',
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
  'datePublished': '2026-04-17',
  'dateModified': '2026-04-17',
  'mainEntityOfPage': {
    '@type': 'WebPage',
    '@id': 'https://utekos.no/inspirasjon/grillkvelden'
  }
}
