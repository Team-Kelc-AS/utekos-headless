import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript } from '../components/JsonLdScript'
import { MagazineArticleShell } from '../components/MagazineArticleShell'
import { buildArticleFaqJsonLd } from '../seo/buildArticleFaqJsonLd'
import { buildArticleJsonLd } from '../seo/buildArticleJsonLd'
import { buildArticleMetadata } from '../seo/buildArticleMetadata'
import { buildBreadcrumbJsonLd } from '../seo/buildBreadcrumbJsonLd'
import { getMagazineArticle } from '../utils/getMagazineArticle'
import { getMagazineArticleSlugs } from '../utils/getMagazineArticleSlugs'
import { getRelatedMagazineArticles } from '../utils/getRelatedMagazineArticles'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getMagazineArticleSlugs()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getMagazineArticle(slug)

  if (!article) {
    return {
      title: 'Artikkel ikke funnet | Utekos'
    }
  }

  return buildArticleMetadata(article)
}

export default async function MagazineArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getMagazineArticle(slug)

  if (!article) {
    notFound()
  }

  const relatedArticles = await getRelatedMagazineArticles(article)
  const faqJsonLd = buildArticleFaqJsonLd(article)

  return (
    <>
      <JsonLdScript data={buildArticleJsonLd(article)} />
      <JsonLdScript data={buildBreadcrumbJsonLd(article)} />
      {faqJsonLd && <JsonLdScript data={faqJsonLd} />}
      <MagazineArticleShell article={article} relatedArticles={relatedArticles} />
    </>
  )
}
