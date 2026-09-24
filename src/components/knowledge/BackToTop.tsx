import styles from './knowledgeChrome.module.css'

/**
 * Plain anchor pill back to the article start. Deliberately not identical
 * to any reference implementation: no client JavaScript, no scroll
 * animation, just a same-page anchor.
 */
export function BackToTop() {
  return (
    <p className={styles.backToTopWrap}>
      <a
        className={styles.backToTop}
        href='#top'
        aria-label='Tilbake til toppen av artikkelen'
      >
        <span aria-hidden='true'>↑</span> Tilbake til toppen
      </a>
    </p>
  )
}
