import Content from './content.mdx'
import { CompareModelsPageHero } from './components/CompareModelsPageHero'
import { buildComparisonMetadata } from './utils/comparisonArticle'
import styles from './comparisonGuide.module.css'
export const metadata = buildComparisonMetadata()

export default function CompareModelsPage() {
  return (
    <article
      className={styles.page}
      aria-labelledby='compare-models-title'
    >
      <CompareModelsPageHero />
      <Content />
    </article>
  )
}
