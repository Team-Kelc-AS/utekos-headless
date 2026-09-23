import { knowledgeAuthors } from '@/content/authors/knowledgeAuthors'
import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import Image from 'next/image'
import Link from 'next/link'
import styles from './knowledgeChrome.module.css'

const dateFormatter = new Intl.DateTimeFormat('nb-NO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Oslo'
})

function formatTimestamp(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function KnowledgeArticleMeta({
  article
}: {
  article: KnowledgeArticle
}) {
  const author = knowledgeAuthors.utekos
  const wasUpdated = article.updatedAt !== article.publishedAt

  return (
    <aside
      className={styles.authorCard}
      aria-label='Forfatter og publiseringsinformasjon'
    >
      <div className={styles.logoFrame}>
        <Image
          className={styles.logo}
          src={author.image}
          width={400}
          height={250}
          sizes='80px'
          alt='Utekos'
        />
      </div>
      <div>
        <p className={styles.authorName}>
          Av{' '}
          <Link
            className={styles.authorLink}
            href='/om-oss'
            rel='author'
          >
            {author.name}
          </Link>
        </p>
        <p className={styles.publicationLine}>
          Publisert{' '}
          <time dateTime={article.publishedAt}>
            {formatTimestamp(article.publishedAt)}
          </time>
          {wasUpdated ?
            <>
              {' · '}Oppdatert{' '}
              <time dateTime={article.updatedAt}>
                {formatTimestamp(article.updatedAt)}
              </time>
            </>
          : null}
        </p>
      </div>
    </aside>
  )
}
