import type { MagazineArticle } from '../types'
import { getMagazineArticles } from './getMagazineArticles'

export async function getMagazineArticle(slug: string): Promise<MagazineArticle | null> {
  const articles = await getMagazineArticles()

  return articles.find(article => article.slug === slug) ?? null
}
