import type { MagazineArticle } from '../types'
import { getMagazineThemeStyle } from '../utils/getMagazineThemeStyle'
import { MagazineArticleBlocks } from './MagazineArticleBlocks'
import { MagazineArticleHeader } from './MagazineArticleHeader'
import { MagazineBreadcrumbs } from './MagazineBreadcrumbs'
import { MagazineNewsletterSection } from './MagazineNewsletterSection'
import { MagazineRelatedArticles } from './MagazineRelatedArticles'

type MagazineArticleShellProps = {
  article: MagazineArticle
  relatedArticles: MagazineArticle[]
}

export function MagazineArticleShell({
  article,
  relatedArticles
}: MagazineArticleShellProps) {
  return (
    <article
      className='bg-background text-foreground'
      style={getMagazineThemeStyle(article.theme)}
    >
      <MagazineBreadcrumbs article={article} />
      <MagazineArticleHeader article={article} />
      <div className='mx-auto w-full max-w-3xl px-4 py-14 sm:py-20'>
        <MagazineArticleBlocks blocks={article.blocks} />
      </div>
      <MagazineRelatedArticles articles={relatedArticles} />
      <MagazineNewsletterSection />
    </article>
  )
}
