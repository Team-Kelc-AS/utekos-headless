import type { Metadata } from 'next'
import styles from './knowledgeArticle.module.css'

export const metadata: Metadata = {
  title: 'Uteguiden - En tjeneste fra Utekos',
  description: 'Uteguidens bokserier',
}

export default function KnowledgeLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <div className={styles.page}>{children}</div>
}
