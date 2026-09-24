import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeChrome.module.css'

export function KnowledgeToc({
  article
}: {
  article: KnowledgeArticle
}) {
  const headingId = `${article.slug}-innhold`

  return (
    <nav
      className={styles.toc}
      aria-labelledby={headingId}
    >
      <h2 id={headingId}>I denne artikkelen</h2>
      <ol className={styles.tocList}>
        {article.toc.map(entry => (
          <li key={entry.id}>
            <a href={`#${entry.id}`}>{entry.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
