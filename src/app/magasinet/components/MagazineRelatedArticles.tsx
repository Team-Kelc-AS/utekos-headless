import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import type { MagazineArticle } from '../types'

type MagazineRelatedArticlesProps = {
  articles: MagazineArticle[]
}

export function MagazineRelatedArticles({
  articles
}: MagazineRelatedArticlesProps) {
  if (articles.length === 0) {
    return null
  }

  return (
    <article className='border-t border-background/10 bg-muted py-16 text-foreground'>
      <div className='container mx-auto px-4'>
        <header className='mb-8 max-w-2xl'>
          <p className='font-utekos-text-medium text-sm leading-4 text-magazine-article-card-pill'>
            Les videre
          </p>
          <h2 className='font-google-sans mt-2 font-sans text-4xl leading-[0.95] font-bold text-foreground'>
            Flere guider fra magasinet
          </h2>
        </header>
        <ul className='grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-3'>
          {articles.map(article => (
            <li key={article.slug} className='h-full'>
              <Link
                href={`/magasinet/${article.slug}` as Route}
                className='group flex h-full flex-col overflow-hidden rounded-lg bg-overcast transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
              >
                <Image
                  src={article.heroImage.src}
                  alt={article.heroImage.alt}
                  width={article.heroImage.width}
                  height={article.heroImage.height}
                  sizes='(max-width: 768px) calc(100vw - 32px), 30vw'
                  className='aspect-16/10 h-auto w-full shrink-0 object-cover'
                />
                <div className='flex flex-1 flex-col bg-background p-5'>
                  <h3 className='font-google-sans font-sans text-2xl leading-[0.98] font-bold text-foreground transition-colors group-hover:text-magazine-article-card-pill'>
                    {article.title}
                  </h3>
                  <p className='mt-3 flex-1 font-utekos-text text-sm leading-[1.3] tracking-normal text-foreground'>
                    {article.excerpt}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
