import { SITE_URL } from '@/constants'
import { knowledgeAuthors } from '@/content/authors/knowledgeAuthors'
import type { Metadata } from 'next'
import {
  knowledgeOverview,
  type KnowledgeArticle
} from './knowledgeArticles'

export function buildKnowledgeOverviewMetadata(): Metadata {
  const url = `${SITE_URL}${knowledgeOverview.path}`

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: knowledgeOverview.metaTitle },
    description: knowledgeOverview.description,
    alternates: { canonical: url },
    authors: [
      { name: knowledgeAuthors.utekos.name, url: SITE_URL }
    ],
    creator: knowledgeAuthors.utekos.name,
    publisher: knowledgeAuthors.utekos.name,
    category: 'Kunnskap',
    openGraph: {
      type: 'website',
      locale: 'nb_NO',
      url,
      siteName: 'Utekos',
      title: knowledgeOverview.metaTitle,
      description: knowledgeOverview.description
    },
    twitter: {
      card: 'summary',
      title: knowledgeOverview.metaTitle,
      description: knowledgeOverview.description
    }
  }
}

export function buildKnowledgeMetadata(
  article: KnowledgeArticle
): Metadata {
  const url = `${SITE_URL}${article.path}`
  const author = knowledgeAuthors.utekos

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: article.metaTitle },
    description: article.description,
    alternates: { canonical: url },
    authors: [{ name: author.name, url: author.url }],
    creator: author.name,
    publisher: author.name,
    category: article.articleSection,
    openGraph: {
      type: 'article',
      locale: 'nb_NO',
      url,
      siteName: 'Utekos',
      title: article.metaTitle,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [author.url],
      section: article.articleSection,
      tags: [...article.topics]
    },
    twitter: {
      card: 'summary',
      title: article.metaTitle,
      description: article.description
    }
  }
}
