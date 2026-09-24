import { KnowledgeOverviewBreadcrumbs } from '@/components/knowledge/KnowledgeOverviewBreadcrumbs'
import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'
import {
  buildKnowledgeOverviewBreadcrumbJsonLd,
  buildKnowledgeOverviewJsonLd
} from '@/lib/knowledge/buildKnowledgeJsonLd'
import { buildKnowledgeOverviewMetadata } from '@/lib/knowledge/buildKnowledgeMetadata'
import {
  knowledgeArticleList,
  knowledgeArticles,
  type KnowledgeArticle
} from '@/lib/knowledge/knowledgeArticles'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import styles from './knowledgeOverview.module.css'

export const metadata = buildKnowledgeOverviewMetadata()

const dateFormatter = new Intl.DateTimeFormat('nb-NO', {
  dateStyle: 'long',
  timeZone: 'Europe/Oslo'
})

const articlesBySection = [
  ...new Set(
    knowledgeArticleList.map(article => article.articleSection)
  )
].map(section => ({
  section,
  articles: knowledgeArticleList.filter(
    article => article.articleSection === section
  )
}))

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

function toSectionId(section: string): string {
  return section
    .toLocaleLowerCase('nb-NO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function ArticleCard({
  article
}: {
  article: KnowledgeArticle
}) {
  return (
    <article className={styles.articleCard}>
      <Link
        className={styles.articleCardLink}
        href={article.path as Route}
        aria-label={`Les ${article.title}`}
      >
        <div className={styles.articleCardMeta}>
          <span>{article.articleSection}</span>
          <span aria-hidden='true'>·</span>
          <time dateTime={article.publishedAt}>
            {formatDate(article.publishedAt)}
          </time>
        </div>
        <h4>{article.title}</h4>
        <p>{article.description}</p>
        <span className={styles.readMore} aria-hidden='true'>
          Les artikkelen <span>↗</span>
        </span>
      </Link>
    </article>
  )
}

export default function KnowledgeOverviewPage() {
  const featuredArticle = knowledgeArticles.cloudweave

  return (
    <div className={styles.overview}>
      <JsonLdScript data={buildKnowledgeOverviewJsonLd()} />
      <JsonLdScript
        data={buildKnowledgeOverviewBreadcrumbJsonLd()}
      />

      <header className={styles.hero}>
        <div className={styles.contentWidth}>
          <KnowledgeOverviewBreadcrumbs />
          <p className={styles.eyebrow}>Utekos kunnskap</p>
          <h1>Kunsten å holde varmen</h1>
          <p className={styles.intro}>
           Utekos handler om å trives ute, uansett temperatur. Her har vi samlet dypdykk og guider som forklarer hvordan kroppen reagerer på kulde, og hvilke materialer som faktisk fungerer når det røyner på. Vitenskapen bak utstyret. Fortalt på en måte du har bruk for.
          </p>
        </div>
      </header>

      <div className={styles.contentWidth}>
        <section
          className={styles.featuredSection}
          aria-labelledby='fremhevet-kunnskap'
        >
          <div className={styles.sectionHeadingRow}>
            <div>
              <p className={styles.eyebrow}>Fremhevet</p>
              <h2 id='fremhevet-kunnskap'>Start her</h2>
            </div>
            <Link className={styles.textLink} href='#artikler'>
              Se alle artikler
            </Link>
          </div>

          <Link
            className={styles.featuredCard}
            href={featuredArticle.path}
            aria-label={`Les ${featuredArticle.title}`}
          >
            <div className={styles.featuredMedia}>
              <Image
                className={styles.featuredImage}
                src='/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-TechDown-Maritime-Blue-Medium-Unisex-Full-Body.png'
                width={1000}
                height={1500}
                sizes='(max-width: 720px) 100vw, 50vw'
                alt='Utekos TechDown™ i Maritime Blue, vist forfra'
                preload
              />
            </div>
            <div className={styles.featuredCopy}>
              <div className={styles.featuredMeta}>
                <span>{featuredArticle.articleSection}</span>
                <span aria-hidden='true'>·</span>
                <time dateTime={featuredArticle.publishedAt}>
                  {formatDate(featuredArticle.publishedAt)}
                </time>
              </div>
              <h3>{featuredArticle.title}</h3>
              <p>{featuredArticle.description}</p>
              <span className={styles.featuredAction}>
                Les artikkelen <span aria-hidden='true'>↗</span>
              </span>
            </div>
          </Link>
        </section>

        <section
          className={styles.librarySection}
          aria-labelledby='artikler'
        >
          <div className={styles.libraryHeader}>
            <div>
              <p className={styles.eyebrow}>
                Utforsk etter tema
              </p>
              <h2 id='artikler'>Alle artikler</h2>
            </div>
            <nav
              className={styles.topicNav}
              aria-label='Hopp til emne'
            >
              {articlesBySection.map(group => (
                <a
                  key={group.section}
                  href={`#${toSectionId(group.section)}`}
                  aria-label={`${group.section}, ${group.articles.length} artikler`}
                >
                  {group.section}
                  <span aria-hidden='true'>
                    {group.articles.length}
                  </span>
                </a>
              ))}
            </nav>
          </div>

          <div className={styles.sectionGroups}>
            {articlesBySection.map(group => (
              <section
                className={styles.topicSection}
                key={group.section}
                aria-labelledby={toSectionId(group.section)}
              >
                <div className={styles.topicHeading}>
                  <h3 id={toSectionId(group.section)}>
                    {group.section}
                  </h3>
                  <p>
                    {group.articles.length}{' '}
                    {group.articles.length === 1 ?
                      'artikkel'
                    : 'artikler'}
                  </p>
                </div>
                <div className={styles.articleGrid}>
                  {group.articles.map(article => (
                    <ArticleCard
                      key={article.slug}
                      article={article}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <aside
          className={styles.editorialNote}
          aria-labelledby='redaksjonell-standard'
        >
          <p className={styles.eyebrow}>Redaksjonell standard</p>
          <h2 id='redaksjonell-standard'>
            Kildene skal være synlige
          </h2>
          <p>
            Hver artikkel viser hvem som står bak, når den er
            publisert og hvilke referanser som er oppgitt. Det
            gjør det enklere å vurdere grunnlaget og gå videre
            til originalkildene.
          </p>
          <Link className={styles.textLink} href='/om-oss'>
            Om Utekos
          </Link>
        </aside>
      </div>
    </div>
  )
}
