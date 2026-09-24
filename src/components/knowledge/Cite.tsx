import styles from './knowledgeChrome.module.css'

/**
 * In-text citation marker. `ids` are 1-based positions in the article's
 * registry `references` array and must match the numbered source list
 * (`#kilde-N`) rendered by KnowledgeSources.
 */
export function Cite({ ids }: { ids: readonly number[] }) {
  return (
    <sup className={styles.cite}>
      [
      {ids.map((id, index) => (
        <span key={id}>
          {index > 0 ? ', ' : null}
          <a href={`#kilde-${id}`}>{id}</a>
        </span>
      ))}
      ]
    </sup>
  )
}
