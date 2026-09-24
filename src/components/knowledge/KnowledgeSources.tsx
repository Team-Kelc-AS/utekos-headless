import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeChrome.module.css'

/**
 * Think-With-Google-style source list: collapsed with a count, expandable
 * without client JavaScript (native details/summary). Every entry keeps its
 * real outbound link where one is known; entries without a url render as
 * plain citations.
 */
export function KnowledgeSources({
  article
}: {
  article: KnowledgeArticle
}) {
  const headingId = `${article.slug}-kilder`

  return (
    <section
      className={styles.sources}
      aria-labelledby={headingId}
    >
      <details className={styles.sourcesDetails}>
        <summary className={styles.sourcesSummary}>
          <span id={headingId}>
            Kilder ({article.references.length})
          </span>
        </summary>
        <ol className={styles.sourcesList}>
          {article.references.map((reference, index) => (
            <li
              key={`${reference.attribution}-${reference.title}`}
              id={`kilde-${index + 1}`}
              className={styles.sourcesItem}
            >
              <span>{reference.attribution}. </span>
              {reference.url ?
                <a
                  href={reference.url}
                  rel='noopener noreferrer'
                >
                  <cite className={styles.sourcesTitle}>
                    {reference.title}
                  </cite>
                </a>
              : <cite className={styles.sourcesTitle}>
                  {reference.title}
                </cite>
              }
              {reference.suffix ?
                <span>{reference.suffix}</span>
              : null}
            </li>
          ))}
        </ol>
      </details>
    </section>
  )
}
