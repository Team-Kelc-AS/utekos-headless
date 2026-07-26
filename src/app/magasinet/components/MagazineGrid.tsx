import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import type { MagazineArticle } from '../types'
import {
  getMagazineHeroTransitionName,
  MAGAZINE_DETAIL_TRANSITION_TYPE
} from '../utils/getMagazineHeroTransitionName'
import { MagazineCategoryBadge } from './MagazineCategoryBadge'
import { MagazineHeroViewTransition } from './MagazineHeroViewTransition'

type MagazineGridProps = { articles: MagazineArticle[] }

const BEREDSKAP_PORTRAIT_HERO = {
  src: '/med-utekos-1080x1350.png',
  width: 1080,
  height: 1350
} as const

const TECHDOWN_LAUNCH_SLUG = 'utekos-techdown-lansering'

const TECHDOWN_GRID_MOBILE_IMAGE = {
  src: '/UtekosTechDown15.jpg',
  width: 1600,
  height: 1000
} as const

function FeaturedArticleCard({
  article
}: {
  article: MagazineArticle
}) {
  const usesPortraitHero =
    article.heroImage.src === '/med-utekos.png'

  return (
    <article className='bg-background py-14 text-foreground sm:py-20'>
      <div className='container mx-auto px-4'>
        <Link
          href={`/magasinet/${article.slug}` as Route}
          className='group grid overflow-hidden rounded-lg bg-card shadow-[0_24px_70px_-54px_color-mix(in_oklch,var(--background)_68%,transparent)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:grid-cols-2'
          data-track='MagazineFeaturedClick'
        >
          {usesPortraitHero ?
            <>
              <Image
                src={BEREDSKAP_PORTRAIT_HERO.src}
                alt={article.heroImage.alt}
                width={BEREDSKAP_PORTRAIT_HERO.width}
                height={BEREDSKAP_PORTRAIT_HERO.height}
                sizes='(max-width: 767px) calc(100vw - 32px), 50vw'
                className='aspect-4/5 h-auto w-full object-cover lg:hidden'
                priority
              />
              <Image
                src={article.heroImage.src}
                alt={article.heroImage.alt}
                width={article.heroImage.width}
                height={article.heroImage.height}
                sizes='50vw'
                className='hidden h-full w-full object-cover lg:block'
                priority
              />
            </>
          : <Image
              src={article.heroImage.src}
              alt={article.heroImage.alt}
              width={article.heroImage.width}
              height={article.heroImage.height}
              sizes='(max-width: 768px) calc(100vw - 32px), 50vw'
              className='aspect-16/11 h-auto w-full object-cover md:aspect-auto md:h-full'
              priority
            />
          }
          <div className='flex flex-col justify-center bg-muted p-6 text-foreground sm:p-9 lg:p-12'>
            <div className='mb-5'>
              <MagazineCategoryBadge
                category={article.category}
              />
            </div>
            <h2 className='font-google-sans font-utekos-text-medium text-4xl leading-[0.95] font-bold text-balance transition-colors group-hover:text-magazine-article-card-pill sm:text-5xl'>
              {article.title}
            </h2>
            <p className='mt-5 font-utekos-text text-lg leading-[1.3] tracking-normal text-foreground/86'>
              {article.excerpt}
            </p>
            <BrandBadge
              backgroundColor='var(--color-magazine-article-card-pill)'
              textColor='var(--background)'
              className='mt-8 w-fit gap-2 rounded-lg border border-background/15 px-4 py-2 font-utekos-text-medium text-sm leading-[1.35] tracking-tight'
            >
              <span>Les hele saken</span>
              <ArrowRight
                className='size-4 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none'
                aria-hidden
              />
            </BrandBadge>
          </div>
        </Link>
      </div>
    </article>
  )
}

function MagazineArticleCard({
  article
}: {
  article: MagazineArticle
}) {
  const usesTechDownBanner =
    article.slug === TECHDOWN_LAUNCH_SLUG
  const heroTransitionName =
    getMagazineHeroTransitionName(article.slug)

  if (usesTechDownBanner) {
    return (
      <li className='col-span-full h-full lg:col-span-1'>
        <Link
          href={`/magasinet/${article.slug}` as Route}
          className='group flex overflow-hidden rounded-lg bg-card transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:hidden'
          data-track='MagazineGridClick'
        >
          <Image
            src={TECHDOWN_GRID_MOBILE_IMAGE.src}
            alt={article.heroImage.alt}
            width={TECHDOWN_GRID_MOBILE_IMAGE.width}
            height={TECHDOWN_GRID_MOBILE_IMAGE.height}
            sizes='(max-width: 768px) calc(100vw - 32px), calc(100vw - 64px)'
            className='aspect-16/10 h-auto w-full object-cover'
          />
          <span className='sr-only'>{article.title}</span>
        </Link>
        <Link
          href={`/magasinet/${article.slug}` as Route}
          className='group hidden h-full flex-col overflow-hidden rounded-lg bg-card transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:flex'
          data-track='MagazineGridClick'
        >
          <Image
            src={article.heroImage.src}
            alt={article.heroImage.alt}
            width={article.heroImage.width}
            height={article.heroImage.height}
            sizes='30vw'
            className='aspect-16/10 h-auto w-full shrink-0 object-cover'
          />
          <div className='flex flex-1 flex-col bg-muted p-5 text-foreground'>
            <div className='mb-4'>
              <MagazineCategoryBadge
                category={article.category}
              />
            </div>
            <h3 className='font-google-sans font-utekos-text-medium text-lg leading-[0.98] font-bold tracking-normal transition-colors group-hover:text-magazine-article-card-pill'>
              {article.title}
            </h3>
            <p className='mt-3 flex-1 font-utekos-text text-sm leading-[1.3] tracking-normal text-foreground/86'>
              {article.excerpt}
            </p>
          </div>
        </Link>
      </li>
    )
  }

  return (
    <li className='h-full'>
      <Link
        href={`/magasinet/${article.slug}` as Route}
        className='group flex h-full flex-col overflow-hidden rounded-lg bg-card transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
        data-track='MagazineGridClick'
        {...(heroTransitionName ?
          {
            transitionTypes: [
              MAGAZINE_DETAIL_TRANSITION_TYPE
            ]
          }
        : {})}
      >
        <MagazineHeroViewTransition slug={article.slug}>
          <Image
            src={article.heroImage.src}
            alt={article.heroImage.alt}
            width={article.heroImage.width}
            height={article.heroImage.height}
            sizes='(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 45vw, 30vw'
            className='aspect-16/10 h-auto w-full shrink-0 object-cover'
          />
        </MagazineHeroViewTransition>
        <div className='flex flex-1 flex-col bg-muted p-5 text-foreground'>
          <div className='mb-4'>
            <MagazineCategoryBadge category={article.category} />
          </div>
          <h3 className='font-google-sans font-utekos-text-medium text-lg leading-[0.98] font-bold tracking-normal transition-colors group-hover:text-magazine-article-card-pill'>
            {article.title}
          </h3>
          <p className='mt-3 flex-1 font-utekos-text text-sm leading-[1.3] tracking-normal text-foreground/86'>
            {article.excerpt}
          </p>
        </div>
      </Link>
    </li>
  )
}

export function MagazineGrid({ articles }: MagazineGridProps) {
  const [featuredArticle, ...otherArticles] = articles

  if (!featuredArticle) {
    return (
      <article className='dark:text-dark-background bg-overcast py-16 text-background'>
        <div className='container mx-auto px-4'>
          <p className='text-lg leading-[1.55]'>
            Ingen artikler er publisert ennå.
          </p>
        </div>
      </article>
    )
  }

  return (
    <>
      <FeaturedArticleCard article={featuredArticle} />
      <article
        className='bg-background pb-16 text-foreground sm:pb-24'
        aria-labelledby='magazine-latest-heading'
      >
        <div className='container mx-auto px-6 sm:px-4'>
          <header className='mb-8 max-w-2xl'>
            <p className='font-utekos-text-medium text-sm leading-4 text-magazine-article-card-pill'>
              Siste fra magasinet
            </p>
            <h2
              id='magazine-latest-heading'
              className='font-google-sans mt-2 font-sans text-4xl leading-[0.95] font-bold sm:text-5xl'
            >
              Flere guider og historier
            </h2>
          </header>
          <ul className='grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {otherArticles.map(article => (
              <MagazineArticleCard
                key={article.slug}
                article={article}
              />
            ))}
          </ul>
        </div>
      </article>
    </>
  )
}
