import styles from './article.module.css'

export type ArticleReference = {
  id: string
  number: number
  author: string
  title: string
  year: string
  url: string
  description: string
}

export function ArticleReferences({
  references,
  idPrefix = 'reference-'
}: {
  references: readonly ArticleReference[]
  idPrefix?: string
}) {
  return (
    <ol className={styles.references}>
      {references.map(reference => (
        <li
          key={reference.id}
          id={`${idPrefix}${reference.id}`}
          value={reference.number}
        >
          <p>
            {reference.author} ({reference.year}).{' '}
            <cite>
              <a href={reference.url}>{reference.title}</a>
            </cite>
            .
          </p>
          <p>{reference.description}</p>
        </li>
      ))}
    </ol>
  )
}
