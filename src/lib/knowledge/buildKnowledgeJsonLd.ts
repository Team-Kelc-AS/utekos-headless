import { SITE_URL } from '@/constants'
import { knowledgeAuthors } from '@/content/authors/knowledgeAuthors'
import type {
  Article,
  BreadcrumbList,
  CollectionPage,
  WithContext
} from 'schema-dts'
import {
  knowledgeArticleList,
  knowledgeOverview,
  type KnowledgeArticle
} from './knowledgeArticles'

export function buildKnowledgeOverviewJsonLd(): WithContext<CollectionPage> {
  const url = `${SITE_URL}${knowledgeOverview.path}`

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    'url': url,
    'name': knowledgeOverview.title,
    'description': knowledgeOverview.description,
    'dateModified': knowledgeOverview.updatedAt,
    'inLanguage': 'nb-NO',
    'isAccessibleForFree': true,
    'publisher': {
      '@type': 'Organization',
      '@id': knowledgeAuthors.utekos.id,
      'name': knowledgeAuthors.utekos.name,
      'url': knowledgeAuthors.utekos.url,
      'logo': {
        '@type': 'ImageObject',
        'url': `${SITE_URL}${knowledgeAuthors.utekos.image}`
      }
    },
    'mainEntity': {
      '@type': 'ItemList',
      'itemListOrder':
        'https://schema.org/ItemListOrderDescending',
      'numberOfItems': knowledgeArticleList.length,
      'itemListElement': knowledgeArticleList.map(
        (article, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'url': `${SITE_URL}${article.path}`,
          'name': article.title
        })
      )
    }
  }
}

export function buildKnowledgeOverviewBreadcrumbJsonLd(): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Utekos',
        'item': SITE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Kunnskap',
        'item': `${SITE_URL}${knowledgeOverview.path}`
      }
    ]
  }
}

export function buildKnowledgeArticleJsonLd(
  article: KnowledgeArticle
): WithContext<Article> {
  const url = `${SITE_URL}${article.path}`
  const author = knowledgeAuthors.utekos

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
    'headline': article.title,
    'description': article.description,
    'articleSection': article.articleSection,
    'datePublished': article.publishedAt,
    'dateModified': article.updatedAt,
    'inLanguage': 'nb-NO',
    'author': {
      '@type': author.type,
      '@id': author.id,
      'name': author.name,
      'url': author.url
    },
    'publisher': {
      '@type': author.type,
      '@id': author.id,
      'name': author.name,
      'url': author.url,
      'logo': {
        '@type': 'ImageObject',
        'url': `${SITE_URL}${author.image}`
      }
    },
    'isAccessibleForFree': true,
    'keywords': article.topics.join(', '),
    'citation': article.references.flatMap(reference =>
      reference.url ? [reference.url] : []
    )
  }
}

export function buildKnowledgeBreadcrumbJsonLd(
  article: KnowledgeArticle
): WithContext<BreadcrumbList> {
  const url = `${SITE_URL}${article.path}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Utekos',
        'item': SITE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Kunnskap',
        'item': `${SITE_URL}${knowledgeOverview.path}`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': article.title,
        'item': url
      }
    ]
  }
}
