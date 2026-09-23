import type { CSSProperties } from 'react'
import { Star } from 'lucide-react'
import styles from './TechdownContent.module.css'

type TechdownRatingStarsProps = {
  rating: number
  label: string
}

export function TechdownRatingStars({
  rating,
  label
}: TechdownRatingStarsProps) {
  return (
    <span className={styles.rating}>
      <span className={styles.stars} aria-hidden='true'>
        {[0, 1, 2, 3, 4].map(index => {
          const fill = Math.min(
            100,
            Math.max(0, (rating - index) * 100)
          )
          return (
            <span
              key={index}
              className={styles.star}
              style={
                { '--star-fill': `${fill}%` } as CSSProperties
              }
            >
              <Star className={styles.starOutline} />
              <span className={styles.starFill}>
                <Star />
              </span>
            </span>
          )
        })}
      </span>
      <span className='sr-only'>{label}</span>
    </span>
  )
}
