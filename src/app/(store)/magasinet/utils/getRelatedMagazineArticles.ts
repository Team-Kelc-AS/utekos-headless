import type { MagazineArticle } from '../types'
import { getMagazineArticles } from './getMagazineArticles'

export async function getRelatedMagazineArticles(article: MagazineArticle) {
  const articles = await getMagazineArticles()
  const articleBySlug = new Map(articles.map(candidate => [candidate.slug, candidate]))
  const relatedFromArticle =
    article.relatedSlugs
      ?.map(slug => articleBySlug.get(slug))
      .filter((candidate): candidate is MagazineArticle => Boolean(candidate)) ?? []

  if (relatedFromArticle.length > 0) {
    return relatedFromArticle.slice(0, 3)
  }

  return articles
    .filter(candidate => candidate.slug !== article.slug && candidate.category === article.category)
    .slice(0, 3)
}
