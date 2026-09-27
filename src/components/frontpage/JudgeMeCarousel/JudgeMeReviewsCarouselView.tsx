import type { JudgeMeFeaturedCarousel } from '@/lib/judgeme/types'
import { JudgeMeStars } from './JudgeMeStars'
import styles from './JudgeMeReviewsCarousel.module.css'

type JudgeMeReviewsCarouselViewProps = {
  data: JudgeMeFeaturedCarousel
}

function formatReviewedOn(value: string | null): string | null {
  if (!value) return null
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!match) return value
  const [, month, day, year] = match
  return `${day}.${month}.${year}`
}

export function JudgeMeReviewsCarouselView({
  data
}: JudgeMeReviewsCarouselViewProps) {
  const formattedRating = data.ratingValue.toLocaleString('nb-NO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return (
    <section
      className={styles.section}
      aria-labelledby='judgeme-carousel-heading'
      data-judgeme-carousel='featured'
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id='judgeme-carousel-heading' className={styles.title}>
            Kundene snakker for oss
          </h2>
          <div className={styles.summary}>
            <JudgeMeStars
              rating={data.ratingValue}
              label={`${formattedRating} av 5 stjerner`}
              size={18}
            />
            <p className={styles.summaryText}>
              {formattedRating} fra {data.reviewCount} anmeldelser
            </p>
          </div>
        </header>
      </div>

      <div
        className={styles.track}
        role='list'
        tabIndex={0}
        aria-label='Kundeanmeldelser'
      >
        {data.reviews.map(review => {
          const reviewedOn = formatReviewedOn(review.reviewedOn)

          return (
            <article
              key={review.id}
              className={styles.card}
              role='listitem'
            >
              <JudgeMeStars
                rating={review.rating}
                label={`${review.rating} av 5 stjerner`}
              />
              <blockquote className={styles.quote}>
                {review.title ? (
                  <span className={styles.quoteTitle}>
                    {review.title}
                  </span>
                ) : null}
                <p>&ldquo;{review.body}&rdquo;</p>
              </blockquote>
              <footer className={styles.footer}>
                <div>
                  <div className={styles.author}>{review.author}</div>
                  {reviewedOn ? (
                    <span className={styles.meta}>{reviewedOn}</span>
                  ) : null}
                </div>
                {review.productTitle ? (
                  <div className={styles.product}>
                    {review.productImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny lazy thumbs must stay off the image optimizer path
                      <img
                        className={styles.productImage}
                        src={review.productImageUrl}
                        alt=''
                        width={36}
                        height={36}
                        loading='lazy'
                        decoding='async'
                      />
                    ) : null}
                    <span className={styles.productTitle}>
                      {review.productTitle}
                    </span>
                  </div>
                ) : null}
              </footer>
            </article>
          )
        })}
      </div>
    </section>
  )
}
