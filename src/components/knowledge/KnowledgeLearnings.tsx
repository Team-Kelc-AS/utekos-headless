import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeChrome.module.css'

export function KnowledgeLearnings({
  article
}: {
  article: KnowledgeArticle
}) {
  const headingId = `${article.slug}-hva-du-vil-laere`

  return (
    <section
      className={styles.learnings}
      aria-labelledby={headingId}
    >
      <h2 id={headingId}>Hva du vil lære</h2>
      <ul className={styles.learningsList}>
        {article.learnings.map(learning => (
          <li key={learning}>{learning}</li>
        ))}
      </ul>
    </section>
  )
}
