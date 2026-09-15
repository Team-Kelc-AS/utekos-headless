import { z } from 'zod'
import { magazineArticleCollectionSchema } from '../schemas/magazineArticleSchema'
import type { MagazineArticle } from '../types'

export type MagazineArticlesValidationResult =
  | {
      success: true
      articles: MagazineArticle[]
    }
  | {
      success: false
      error: string
    }

function getDuplicateSlugs(articles: MagazineArticle[]) {
  const seenSlugs = new Set<string>()
  const duplicateSlugs = new Set<string>()

  articles.forEach(article => {
    if (seenSlugs.has(article.slug)) {
      duplicateSlugs.add(article.slug)
      return
    }

    seenSlugs.add(article.slug)
  })

  return Array.from(duplicateSlugs)
}

export function validateMagazineArticles(input: unknown): MagazineArticlesValidationResult {
  const parsedArticles = magazineArticleCollectionSchema.safeParse(input)

  if (!parsedArticles.success) {
    return {
      success: false,
      error: z.prettifyError(parsedArticles.error)
    }
  }

  const duplicateSlugs = getDuplicateSlugs(parsedArticles.data)

  if (duplicateSlugs.length > 0) {
    return {
      success: false,
      error: `Duplicate magazine slugs: ${duplicateSlugs.join(', ')}`
    }
  }

  return {
    success: true,
    articles: parsedArticles.data
  }
}
