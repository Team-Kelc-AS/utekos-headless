import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowUpRight, Layers, Thermometer } from 'lucide-react'
import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'
import {
  buildKnowledgeOverviewBreadcrumbJsonLd,
  buildKnowledgeOverviewJsonLd
} from '@/lib/knowledge/buildKnowledgeJsonLd'
import {
  knowledgeArticleList,
  knowledgeArticles,
  type KnowledgeArticle
} from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeOverview.module.css'

const topics = [
  ...new Set(
    knowledgeArticleList.map(article => article.articleSection)
  )
]

function topicId(topic: string) {
  return topic
    .toLocaleLowerCase('nb-NO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function ArticleMeta({
  article
}: {
  article: KnowledgeArticle
}) {
  const publishedDate = new Intl.DateTimeFormat('nb-NO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Oslo'
  }).format(new Date(article.publishedAt))
  const CategoryIcon =
    article.articleSection === 'Kulde og varme' ?
      Thermometer
    : Layers
  return (
    <div className={styles.meta}>
      <span className={styles.categoryTag}>
        <CategoryIcon size={18} aria-hidden='true' />
        {article.articleSection}
      </span>
      <time dateTime={article.publishedAt}>
        {publishedDate.charAt(0).toLocaleUpperCase('nb-NO') +
          publishedDate.slice(1)}
      </time>
    </div>
  )
}

function ArticleImage({
  article
}: {
  article: KnowledgeArticle
}) {
  const image =
    article.slug === 'ykk' ?
      {
        src: '/fea-simulation-mesh-16_9.png',
        width: 1672,
        height: 941,
        alt: 'Illustrasjon av glidelåsens glider og tenner med et teknisk rutenett'
      }
    : article.slug === 'hva-skal-man-ha-innerst' ?
      {
        src: '/images/kunnskap/innerlag-16x9.png',
        width: 1672,
        height: 941,
        alt: 'Illustrasjon av tre brettede innerlag i lyse, grå og grønne tekstiler på en hyttebenk'
      }
    : article.slug === 'cloudweave' ?
      {
        src: '/og-image-skreddersy-varmen.jpg',
        width: 1200,
        height: 630,
        alt: 'To personer i varme plagg på en terrasse'
      }
    : article.slug === 'hvordan-holde-varmen-ute' ?
      {
        src: '/og-emphathy-bonfire.webp',
        width: 1200,
        height: 630,
        alt: 'To personer holder varmen ved et bål på terrassen'
      }
    : {
        src: '/images/kunnskap/hvorfor-blir-man-kald-16x9.jpg',
        width: 1672,
        height: 941,
        alt: 'To personer venter ved et snødekt busstopp en kald vinterdag'
      }
  return (
    <Image
      {...image}
      alt={image.alt}
      className={styles.cardImage}
      sizes='(max-width: 639px) calc(100vw - 72px), (max-width: 1023px) calc(50vw - 64px), 350px'
    />
  )
}

export function KnowledgeOverviewStructuredData() {
  return (
    <>
      <JsonLdScript data={buildKnowledgeOverviewJsonLd()} />
      <JsonLdScript
        data={buildKnowledgeOverviewBreadcrumbJsonLd()}
      />
    </>
  )
}

export function KnowledgeFeaturedStories() {
  const main = knowledgeArticles.cold
  const recommended = [
    knowledgeArticles.cloudweave,
    knowledgeArticles.baseLayer,
    knowledgeArticles.ykk
  ]
  return (
    <div className={styles.featuredGrid}>
      <article className={styles.leadStory}>
        <Link href={main.path} className={styles.leadLink}>
          <Image
            src='/images/kunnskap/hvorfor-blir-man-kald-16x9.jpg'
            width={1672}
            height={941}
            alt='To personer venter ved et snødekt busstopp en kald vinterdag'
            sizes='(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(100vw - 3rem), (max-width: 1264px) 58vw, 726px'
            loading='eager'
            fetchPriority='high'
            className={styles.leadImage}
          />
          <div className={styles.leadCopy}>
            <ArticleMeta article={main} />
            <h3>{main.title}</h3>
            <p className={styles.description}>
              {main.description}
            </p>
            <span className={styles.readMore}>
              Les artikkelen{' '}
              <ArrowUpRight aria-hidden='true' size={20} />
            </span>
          </div>
        </Link>
      </article>
      <aside
        className={styles.recommended}
        aria-labelledby='anbefalt-lesning'
      >
        <h3 id='anbefalt-lesning'>Anbefalt lesning</h3>
        {recommended.map(article => (
          <article
            key={article.slug}
            className={styles.recommendedStory}
          >
            <Link href={article.path}>
              <ArticleImage article={article} />
              <div className={styles.storyText}>
                <ArticleMeta article={article} />
                <h4>{article.title.replace(' – ', ': ')}</h4>
                <ArrowUpRight
                  className={styles.storyArrow}
                  aria-hidden='true'
                  size={22}
                />
              </div>
            </Link>
          </article>
        ))}
      </aside>
    </div>
  )
}

export function KnowledgeTopicLibrary() {
  return (
    <>
      <nav
        className={styles.topicNav}
        aria-label='Hopp til emne'
      >
        {topics.map(topic => (
          <a href={`#${topicId(topic)}`} key={topic}>
            {topic}
            <ArrowUpRight size={18} aria-hidden='true' />
          </a>
        ))}
      </nav>
      {topics.map(topic => (
        <section
          className={styles.topicSection}
          key={topic}
          aria-labelledby={topicId(topic)}
        >
          <h3 id={topicId(topic)}>{topic}</h3>
          <div className={styles.articleGrid}>
            {knowledgeArticleList
              .filter(
                article => article.articleSection === topic
              )
              .map(article => (
                <article
                  className={styles.articleCard}
                  key={article.slug}
                >
                  <Link href={article.path as Route}>
                    <ArticleImage article={article} />
                    <ArticleMeta article={article} />
                    <h4>{article.title.replace(' – ', ': ')}</h4>
                    <span className={styles.readMore}>
                      Les artikkelen
                      <ArrowUpRight
                        size={20}
                        aria-hidden='true'
                      />
                    </span>
                  </Link>
                </article>
              ))}
          </div>
        </section>
      ))}
    </>
  )
}
