import type { CSSProperties } from 'react'
import styles from './TechdownContent.module.css'

type TechdownRatingStarsProps = {
  rating: number
  label: string
}

const STAR_PATH =
  'M12 2L14.4 9.6H22L15.8 14.2L18.2 21.8L12 17.2L5.8 21.8L8.2 14.2L2 9.6H9.6L12 2Z'

function StarGlyph() {
  return (
    <svg
      className={styles.starGlyph}
      viewBox='0 0 24 24'
      width={16}
      height={16}
      aria-hidden='true'
      focusable='false'
    >
      <path d={STAR_PATH} fill='currentColor' />
    </svg>
  )
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
              <span className={styles.starOutline}>
                <StarGlyph />
              </span>
              <span className={styles.starFill}>
                <StarGlyph />
              </span>
            </span>
          )
        })}
      </span>
      <span className='sr-only'>{label}</span>
    </span>
  )
}
