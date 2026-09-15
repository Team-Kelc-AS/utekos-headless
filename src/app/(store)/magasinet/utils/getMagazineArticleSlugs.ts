import { getMagazineArticles } from './getMagazineArticles'

export async function getMagazineArticleSlugs() {
  const articles = await getMagazineArticles()

  return articles.map(article => ({ slug: article.slug }))
}
