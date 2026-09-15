import { SITE_URL } from '@/constants'
import type { MagazineArticle } from '../types'
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl'

type MagazineCollectionJsonLd = Record<string, unknown>

export function buildMagazineCollectionJsonLd(articles: MagazineArticle[]): MagazineCollectionJsonLd {
  const itemListElement = articles.map((article, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'url': `${SITE_URL}/magasinet/${article.slug}`,
    'name': article.title,
    'image': toAbsoluteUrl(article.heroImage.src)
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/magasinet#collection`,
    'name': 'Utekos Magasinet',
    'url': `${SITE_URL}/magasinet`,
    'description':
      'Redaksjonelle guider, råd og historier fra Utekos om hytteliv, terrasseliv, båtliv, bobilliv og personlig varme ute.',
    'isPartOf': {
      '@id': `${SITE_URL}/#website`
    },
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      'url': `${SITE_URL}/og-image-utekos-magasinet.jpg`
    },
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': itemListElement
    }
  }
}
