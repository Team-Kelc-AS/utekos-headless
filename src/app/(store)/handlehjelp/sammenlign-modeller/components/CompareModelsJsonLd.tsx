import { SITE_URL } from '@/constants'
import { comparisonArticle as article } from '../utils/comparisonArticle'
import type { Graph } from 'schema-dts'
import {
  faqItems,
  modelRecommendations
} from '../utils/comparisonData'

const PAGE_URL = `${SITE_URL}${article.path}`

// This is a comparison guide, not a purchasable product or a group of variants.
// Prices, stock and ratings belong on the product pages with current source data.
export function buildComparisonJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${PAGE_URL}#webpage`,
        'url': PAGE_URL,
        'name': article.title,
        'description': article.description,
        'inLanguage': 'nb-NO',
        'citation': article.references.map(reference => ({
          '@type': 'CreativeWork',
          'name': reference.title,
          'url': reference.url
        })),
        'author': {
          '@type': 'Organization',
          'name': article.author.name,
          'url': article.author.url
        },
        'publisher': { '@id': article.publisher.id },
        'isPartOf': {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          'name': 'Utekos',
          'url': SITE_URL
        },
        'breadcrumb': { '@id': `${PAGE_URL}#breadcrumb` },
        'mainEntity': { '@id': `${PAGE_URL}#article` },
        'primaryImageOfPage': {
          '@type': 'ImageObject',
          'url': `${SITE_URL}${article.image.src}`,
          'width': String(article.image.width),
          'height': String(article.image.height),
          'caption': article.image.alt
        }
      },
      {
        '@type': 'Article',
        '@id': `${PAGE_URL}#article`,
        'headline': article.title,
        'description': article.description,
        'abstract': article.intro,
        'inLanguage': 'nb-NO',
        'mainEntityOfPage': { '@id': `${PAGE_URL}#webpage` },
        'author': {
          '@type': 'Organization',
          'name': article.author.name,
          'url': article.author.url
        },
        'publisher': { '@id': article.publisher.id },
        'image': `${SITE_URL}${article.image.src}`,
        'articleSection': article.category,
        'keywords': [...article.topics],
        'citation': article.references.map(reference => ({
          '@type': 'CreativeWork',
          'name': reference.title,
          'url': reference.url
        })),
        'hasPart': [
          { '@id': `${PAGE_URL}#model-list` },
          { '@id': `${PAGE_URL}#faq` }
        ]
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        // Handlehjelp is a visible grouping label, not a page with its own URL.
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Forsiden',
            'item': SITE_URL
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Sammenlign modeller',
            'item': PAGE_URL
          }
        ]
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#model-list`,
        'name': 'Sammenlign Utekos-modellene',
        'numberOfItems': modelRecommendations.length,
        'itemListOrder': 'https://schema.org/ItemListUnordered',
        'itemListElement': modelRecommendations.map(
          (model, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': model.name,
            'url': `${SITE_URL}${model.href}`
          })
        )
      },
      {
        '@type': 'FAQPage',
        '@id': `${PAGE_URL}#faq`,
        'url': `${PAGE_URL}#vanlige-sporsmal`,
        'isPartOf': { '@id': `${PAGE_URL}#webpage` },
        'mainEntity': faqItems.map(item => ({
          '@type': 'Question',
          'name': item.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.answer
          }
        }))
      }
    ]
  } satisfies Graph
  return jsonLd
}

export function CompareModelsJsonLd() {
  const jsonLd = buildComparisonJsonLd()
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
      }}
    />
  )
}
