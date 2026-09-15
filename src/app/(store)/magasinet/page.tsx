import type { Metadata } from 'next'
import { JsonLdScript } from './components/JsonLdScript'
import { MagazineBreadcrumbs } from './components/MagazineBreadcrumbs'
import { MagazineGrid } from './components/MagazineGrid'
import { MagazineOverviewHero } from './components/MagazineOverviewHero'
import { buildMagazineCollectionJsonLd } from './seo/buildMagazineCollectionJsonLd'
import { buildMagazineOverviewMetadata } from './seo/buildMagazineOverviewMetadata'
import { getMagazineArticles } from './utils/getMagazineArticles'

export const metadata: Metadata = buildMagazineOverviewMetadata()

export default async function MagazinePage() {
  const articles = await getMagazineArticles()

  return (
    <main className='bg-overcast text-background'>
      <JsonLdScript
        data={buildMagazineCollectionJsonLd(articles)}
      />
      <MagazineBreadcrumbs />
      <MagazineOverviewHero articleCount={articles.length} />
      <MagazineGrid articles={articles} />
    </main>
  )
}
