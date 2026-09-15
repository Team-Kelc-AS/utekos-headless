import Image from 'next/image'
import { CalendarDays, Clock, PencilLine } from 'lucide-react'
import type { MagazineArticle } from '../types'
import { formatMagazineArticleDate } from '../utils/formatMagazineArticleDate'
import { MagazineHeroViewTransition } from './MagazineHeroViewTransition'
import techdown1600x1000 from '@/assets/images/techdown/TechDown-1600x1000.webp'
import utekostechdownmobile from '@/assets/images/techdown/UtekosTechDownMobile.png'

type MagazineArticleHeaderProps = { article: MagazineArticle }

const TECHDOWN_SLUG = 'utekos-techdown-lansering'

export function MagazineArticleHeader({
  article
}: MagazineArticleHeaderProps) {
  const publishedDate = formatMagazineArticleDate(
    article.publishedAt
  )
  const updatedDate =
    article.updatedAt !== article.publishedAt ?
      formatMagazineArticleDate(article.updatedAt)
    : null

  const isTechDownLaunch = article.slug === TECHDOWN_SLUG
  const desktopImage = {
    src: isTechDownLaunch ?
      techdown1600x1000
    : article.heroImage.src,
    width: isTechDownLaunch ? 1600 : article.heroImage.width,
    height: isTechDownLaunch ? 1000 : article.heroImage.height,
    alt: article.heroImage.alt
  }
  const mobileImage = {
    src: isTechDownLaunch ? utekostechdownmobile : article.heroImage.src,
    width: isTechDownLaunch ? 400 : article.heroImage.width,
    height: isTechDownLaunch ? 590 : article.heroImage.height,
    alt: article.heroImage.alt
  }

  return (
    <header className='bg-magazine-header text-foreground'>
      <div className='container mx-auto px-4 pt-6 sm:pt-8 md:px-2 lg:px-0'>
        <h1 className='sr-only'>{article.title}</h1>
        <MagazineHeroViewTransition slug={article.slug}>
          <figure className='overflow-hidden rounded-lg'>
            <Image
              src={mobileImage.src}
              alt={mobileImage.alt}
              width={mobileImage.width}
              height={mobileImage.height}
              sizes='100vw'
              className='h-auto w-full object-cover md:hidden'
              priority
            />
            <Image
              src={desktopImage.src}
              alt={desktopImage.alt}
              width={desktopImage.width}
              height={desktopImage.height}
              sizes='(max-width: 1023px) calc(100vw - 16px), (max-width: 1280px) 100vw, 1200px'
              className='hidden h-auto w-full object-cover md:block'
              priority
            />
          </figure>
        </MagazineHeroViewTransition>
        <div className='flex flex-wrap items-center gap-x-5 gap-y-3 py-4 text-sm leading-4 text-foreground/80'>
          <span className='inline-flex items-center gap-2'>
            <CalendarDays className='size-4' aria-hidden />
            <time dateTime={article.publishedAt}>
              {publishedDate}
            </time>
          </span>
          {updatedDate && (
            <span className='inline-flex items-center gap-2'>
              <PencilLine className='size-4' aria-hidden />
              <span>
                Oppdatert{' '}
                <time dateTime={article.updatedAt}>
                  {updatedDate}
                </time>
              </span>
            </span>
          )}
          {article.readingTimeMinutes && (
            <span className='inline-flex items-center gap-2'>
              <Clock className='size-4' aria-hidden />
              <span>
                {article.readingTimeMinutes} min lesing
              </span>
            </span>
          )}
          {article.author && (
            <span>Av {article.author.name}</span>
          )}
        </div>
      </div>
    </header>
  )
}
