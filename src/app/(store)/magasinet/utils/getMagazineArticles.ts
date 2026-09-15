import { cacheLife, cacheTag } from 'next/cache'
import { rawMagazineArticles } from '../data/magazineArticles'
import type { MagazineArticle } from '../types'
import { validateMagazineArticles } from './validateMagazineArticles'

export async function getMagazineArticles(): Promise<MagazineArticle[]> {
  'use cache'
  cacheLife('content')
  cacheTag('magazine', 'magazine-articles')

  const validationResult = validateMagazineArticles(rawMagazineArticles)

  if (!validationResult.success) {
    console.error(validationResult.error)
    return []
  }

  return validationResult.articles
}
