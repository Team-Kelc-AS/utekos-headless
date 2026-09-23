import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import Link from 'next/link'
import styles from './knowledgeChrome.module.css'

export function KnowledgeArticleBreadcrumbs({
  article
}: {
  article: KnowledgeArticle
}) {
  return (
    <nav className={styles.breadcrumbs} aria-label='Brødsmuler'>
      <ol className={styles.breadcrumbList}>
        <li className={styles.breadcrumbItem}>
          <Link className={styles.breadcrumbLink} href='/'>
            Forsiden
          </Link>
        </li>
        <li className={styles.breadcrumbItem}>
          <span aria-hidden='true'>/</span>
          <Link
            className={styles.breadcrumbLink}
            href='/kunnskap'
          >
            Kunnskap
          </Link>
        </li>
        <li className={styles.breadcrumbItem}>
          <span aria-hidden='true'>/</span>
          <span
            className={styles.breadcrumbCurrent}
            aria-current='page'
          >
            {article.title}
          </span>
        </li>
      </ol>
    </nav>
  )
}
