import type { CSSProperties } from 'react'
import styles from './JudgeMeReviewsCarousel.module.css'

type JudgeMeStarsProps = {
  rating: number
  label: string
  size?: number
}

const STAR_PATH =
  'M12 2L14.4 9.6H22L15.8 14.2L18.2 21.8L12 17.2L5.8 21.8L8.2 14.2L2 9.6H9.6L12 2Z'

function StarGlyph({ size }: { size: number }) {
  return (
    <svg
      className={styles.starGlyph}
      viewBox='0 0 24 24'
      width={size}
      height={size}
      aria-hidden='true'
      focusable='false'
    >
      <path d={STAR_PATH} fill='currentColor' />
    </svg>
  )
}

export function JudgeMeStars({
  rating,
  label,
  size = 16
}: JudgeMeStarsProps) {
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
                <StarGlyph size={size} />
              </span>
              <span className={styles.starFill}>
                <StarGlyph size={size} />
              </span>
            </span>
          )
        })}
      </span>
      <span className='sr-only'>{label}</span>
    </span>
  )
}
