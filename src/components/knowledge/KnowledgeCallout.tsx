import type { ReactNode } from 'react'
import styles from './knowledgeChrome.module.css'

export function KnowledgeCallout({
  title,
  tone = 'evidence',
  appearance,
  children
}: {
  title: string
  tone?: 'evidence' | 'note' | 'caution'
  appearance?: 'dark'
  children: ReactNode
}) {
  return (
    <aside
      className={styles.callout}
      data-tone={tone}
      data-appearance={appearance}
      aria-label={title}
    >
      <p className={styles.calloutTitle}>{title}</p>
      <div className={styles.calloutBody}>{children}</div>
    </aside>
  )
}
