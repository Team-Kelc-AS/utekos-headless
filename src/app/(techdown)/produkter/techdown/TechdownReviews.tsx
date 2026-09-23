import { Suspense } from 'react'
import { io } from 'next/cache'
import { CircleCheck } from 'lucide-react'
import {
  techDownReviewBundle,
  type ProductReviewItem
} from '@/db/data/reviews/productReviews'
import { ReviewAgeLabel } from './ReviewAgeLabel'
import { TechdownRatingStars } from './TechdownRatingStars'
import styles from './TechdownContent.module.css'

const IMPORT_OBSERVED_AT = '2026-09-23T12:00:00+02:00'
const { ratingValue, reviewCount } =
  techDownReviewBundle.aggregateRating
const formattedRating = ratingValue.toLocaleString('nb-NO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const FEATURED_REVIEW_IDS = new Set([
  'techdown-edvin-ole-holstad-20260922',
  'techdown-lisa-holtermann-20260902',
  'techdown-per-erik-skei-20260824'
])

function ReviewCard({
  review,
  initialNowIso
}: {
  review: ProductReviewItem
  initialNowIso: string
}) {
  return (
    <article className={styles.reviewCard}>
      <TechdownRatingStars
        rating={review.ratingValue}
        label={`${review.ratingValue} av 5 stjerner`}
      />
      <p className={styles.reviewText}>{review.reviewBody}</p>
      <footer className={styles.reviewFooter}>
        <div className={styles.reviewerLine}>
          <strong>{review.author}</strong>
          <CircleCheck size={18} aria-hidden='true' />
          <span>Verifisert kjøper</span>
          <span className='sr-only'> gjennom Judge.me</span>
        </div>
        <span className={styles.reviewAge}>
          <ReviewAgeLabel
            date={review.date}
            initialNowIso={initialNowIso}
          />
        </span>
      </footer>
    </article>
  )
}

function ReviewSection({
  initialNowIso
}: {
  initialNowIso: string
}) {
  const featuredReviews = techDownReviewBundle.reviews.filter(
    review => FEATURED_REVIEW_IDS.has(review.id)
  )
  const remainingReviews = techDownReviewBundle.reviews.filter(
    review => !FEATURED_REVIEW_IDS.has(review.id)
  )

  return (
    <section
      id='anmeldelser'
      className={styles.reviews}
      data-journey-section='reviews'
      aria-labelledby='reviews-heading'
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>
          Verifiserte produktomtaler
        </p>
        <h2 id='reviews-heading'>Dette sier kundene</h2>
        <p className={styles.reviewSummary}>
          {formattedRating} av 5 fra {reviewCount} verifiserte
          anmeldelser via Judge.me
        </p>
        <p className={styles.reviewDisclosure}>
          Her viser vi {techDownReviewBundle.reviews.length}{' '}
          produktomtaler fra de {reviewCount} verifiserte
          anmeldelsene.
        </p>
      </div>

      <div className={styles.reviewList}>
        {featuredReviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            initialNowIso={initialNowIso}
          />
        ))}
      </div>

      <details className={styles.moreReviews}>
        <summary>
          <span className={styles.showMore}>
            Vis {remainingReviews.length} flere anmeldelser
          </span>
          <span className={styles.showLess}>
            Vis færre anmeldelser
          </span>
        </summary>
        <div className={styles.reviewList}>
          {remainingReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              initialNowIso={initialNowIso}
            />
          ))}
        </div>
      </details>
    </section>
  )
}

async function CurrentReviewSection() {
  await io()
  return (
    <ReviewSection initialNowIso={new Date().toISOString()} />
  )
}

/** Keep reviews independent so they can follow the future purchase controls. */
export function TechdownReviews() {
  return (
    <Suspense
      fallback={
        <ReviewSection initialNowIso={IMPORT_OBSERVED_AT} />
      }
    >
      <CurrentReviewSection />
    </Suspense>
  )
}
