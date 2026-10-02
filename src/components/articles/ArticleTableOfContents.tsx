import styles from './article.module.css'
import { CaretDownIcon } from '@/components/utekos-icons'

export type ArticleTocEntry = {
  id: string
  label: string
  description?: string
}

export function ArticleTableOfContents({
  title = 'Innhold i artikkelen',
  id = 'article-contents',
  entries
}: {
  title?: string
  id?: string
  entries: readonly ArticleTocEntry[]
}) {
  return (
    <nav className={styles.toc} aria-labelledby={id}>
      <details className={styles.tocDisclosure}>
        <summary id={id} className={styles.tocSummary}>
          <span>{title}</span>
          <CaretDownIcon tone="orange"
            aria-hidden='true'
            className={styles.tocChevron}
          />
        </summary>
        <ol className={styles.tocList}>
          {entries.map(entry => (
            <li key={entry.id}>
              <a href={`#${entry.id}`}>
                <span>{entry.label}</span>
                {entry.description && (
                  <small>{entry.description}</small>
                )}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  )
}
