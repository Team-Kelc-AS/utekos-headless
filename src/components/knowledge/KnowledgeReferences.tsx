import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeChrome.module.css'

export function KnowledgeReferences({
  article
}: {
  article: KnowledgeArticle
}) {
  const headingId = `${article.slug}-referanser`

  return (
    <section
      className={styles.references}
      aria-labelledby={headingId}
    >
      <h2 id={headingId}>Referanser</h2>
      <ol className={styles.referenceList}>
        {article.references.map(reference => (
          <li
            className={styles.referenceItem}
            key={`${reference.attribution}-${reference.title}`}
          >
            <span>{reference.attribution}. </span>
            {reference.url ?
              <a href={reference.url}>
                <cite className={styles.referenceTitle}>
                  {reference.title}
                </cite>
              </a>
            : <cite className={styles.referenceTitle}>
                {reference.title}
              </cite>
            }
            {reference.suffix ?
              <span>{reference.suffix}</span>
            : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
