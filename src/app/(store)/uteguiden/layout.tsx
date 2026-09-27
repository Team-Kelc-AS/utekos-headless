import type { ReactNode } from 'react'
import styles from './knowledgeArticle.module.css'

export default function KnowledgeLayout({
  children
}: {
  children: ReactNode
}) {
  return <div className={styles.page}>{children}</div>
}
