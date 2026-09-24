import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeChrome.module.css'
import { KnowledgeArticleMeta } from './KnowledgeArticleMeta'

export function KnowledgeArticleIntro({
  article
}: {
  article: KnowledgeArticle
}) {
  return (
    <header className={styles.intro}>
      <h1 className={styles.title}>{article.title}</h1>
      <p className={styles.ingress}>{article.description}</p>
      <KnowledgeArticleMeta article={article} />
    </header>
  )
}
