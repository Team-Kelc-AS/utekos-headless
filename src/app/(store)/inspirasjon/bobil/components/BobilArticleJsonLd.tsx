import type { Article, WithContext } from 'schema-dts'
import Script from 'next/script'

export const BobilArticleJsonLd: WithContext<Article> = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Bobil og Utekos: Din guide til ultimate komfort på tur',
  'description':
    'Komplett guide for hvordan Utekos-plagg forvandler bobilopplevelsen i Norge. Tips, råd og inspirasjon for alle sesonger.',
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
  'datePublished': '2026-05-30',
  'dateModified': '2026-05-30',
  'mainEntityOfPage': {
    '@type': 'WebPage',
    '@id': 'https://utekos.no/inspirasjon/bobil'
  }
}

export function BobilArticleJsonLdScript() {
  return (
    <Script id='bobil-article-json-ld' type='application/ld+json'>
      {`${JSON.stringify(BobilArticleJsonLd).replace(/</g, '\\u003c')}`}
    </Script>
  )
}
