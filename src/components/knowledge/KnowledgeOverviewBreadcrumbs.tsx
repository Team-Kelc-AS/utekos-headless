import Link from 'next/link'
import styles from './knowledgeChrome.module.css'

export function KnowledgeOverviewBreadcrumbs() {
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
          <span
            className={styles.breadcrumbCurrent}
            aria-current='page'
          >
            Kunnskap
          </span>
        </li>
      </ol>
    </nav>
  )
}
