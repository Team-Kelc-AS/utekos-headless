import type { ReactNode } from 'react'
import styles from './article.module.css'

export function ArticleSection({
  id,
  labelledBy,
  tone = 'default',
  children
}: {
  id?: string
  labelledBy: string
  tone?: 'default' | 'contrast'
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={styles.section}
      data-tone={tone}
    >
      <div className={styles.container}>{children}</div>
    </section>
  )
}
