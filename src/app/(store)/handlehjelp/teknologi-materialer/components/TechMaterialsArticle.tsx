import type { ReactNode } from 'react'
import { TechMaterialsTableOfContents } from './TechMaterialsTableOfContents'
import styles from './TechMaterialsArticle.module.css'

export function TechMaterialsArticle({
  children
}: {
  children: ReactNode
}) {
  return (
    <section
      aria-label='Teknologi og materialer'
      className={`container mx-auto px-4 pt-8 pb-16 text-foreground ${styles.document}`}
    >
      <TechMaterialsTableOfContents />
      <div className={styles.content}>{children}</div>
    </section>
  )
}
