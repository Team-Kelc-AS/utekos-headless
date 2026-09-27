import type { Route } from 'next'
import Link from 'next/link'
import { modelRecommendations } from '../utils/comparisonData'
import styles from '../comparisonGuide.module.css'

export function PersonaCards() {
  return (
    <ul className={styles.cards}>
      {modelRecommendations.map(model => (
        <li key={model.key}>
          <section
            aria-labelledby={`${model.key}-title`}
            className={styles.card}
          >
            <span className={styles.pill}>{model.badge}</span>
            <h3 id={`${model.key}-title`}>{model.name}</h3>
            <p>
              <strong>{model.bestFor}</strong>
            </p>
            <p>{model.description}</p>
            <ul className={styles.points}>
              {model.proofPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link
              href={model.href as Route}
              className={styles.button}
            >
              {model.cta}
            </Link>
          </section>
        </li>
      ))}
    </ul>
  )
}
