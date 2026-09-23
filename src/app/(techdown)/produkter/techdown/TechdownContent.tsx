import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  ArrowLeftRight,
  PersonStanding,
  SlidersHorizontal,
  Sofa
} from 'lucide-react'
import { techDownReviewBundle } from '@/db/data/reviews/productReviews'
import { TechdownRatingStars } from './TechdownRatingStars'
import {
  TechdownSizeSelector,
  TechdownSizeSelectorFallback
} from './TechdownSizeSelector'
import styles from './TechdownContent.module.css'

const { ratingValue, reviewCount } =
  techDownReviewBundle.aggregateRating
const formattedRating = ratingValue.toLocaleString('nb-NO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
export function TechdownContent() {
  return (
    <div className={styles.content}>
      <section
        className={styles.trustPanel}
        data-journey-section='purchase'
        aria-labelledby='trust-heading'
      >
        <h2 id='trust-heading' className='sr-only'>
          Frakt, bytte og betaling
        </h2>
        <div className={styles.trustGrid}>
          <a
            className={styles.judgeSummary}
            href='#anmeldelser'
            data-journey-link='techdown-review-summary'
            aria-label={`${ratingValue.toFixed(1)}/5 · ${reviewCount} anmeldelser. Gå til anmeldelser.`}
          >
            <span className={styles.judgeLogoSurface}>
              <Image
                src='/judge_me.svg'
                alt='Judge.me Reviews'
                width={277}
                height={53}
                unoptimized
              />
            </span>
            <span className={styles.judgeScore}>
              <TechdownRatingStars
                rating={ratingValue}
                label={`${formattedRating} av 5`}
              />
              <span>
                {ratingValue.toFixed(1)}/5 · {reviewCount}{' '}
                anmeldelser
              </span>
            </span>
          </a>

          <div className={styles.trustRow}>
            <span className={styles.trustIconSurface}>
              <Image
                src='/postnord_blue_wordmark.svg'
                alt='PostNord'
                width={1064}
                height={200}
                unoptimized
              />
            </span>
            <div>
              <h3>Gratis frakt</h3>
              <Link href='/frakt-og-retur'>Se fraktvilkår</Link>
            </div>
          </div>
          <div className={styles.trustRow}>
            <span
              className={styles.exchangeIcon}
              aria-hidden='true'
            >
              <ArrowLeftRight />
            </span>
            <div>
              <h3>Gratis bytte</h3>
              <Link href='/frakt-og-retur#storrelsesbytte'>
                Se vilkår for bytte
              </Link>
            </div>
          </div>
        </div>
        <Suspense fallback={<TechdownSizeSelectorFallback />}>
          <TechdownSizeSelector />
        </Suspense>
        <div className={`${styles.paymentRow} rounded-lg`}>
          <div
            className={styles.paymentLogos}
            aria-label='Betalingsmetoder'
          >
            <Image
              className={styles.logoKlarna}
              src='/klarna_orig.svg'
              alt='Klarna'
              width={69}
              height={30}
              unoptimized
            />
            <Image
              className={styles.logoVisa}
              src='/visa_orig.svg'
              alt='Visa'
              width={63}
              height={21}
              unoptimized
            />
            <Image
              className={styles.logoVipps}
              src='/vipps_orig.svg'
              alt='Vipps'
              width={92}
              height={24}
              unoptimized
            />
            <Image
              className={styles.logoGooglePay}
              src='/gpay_orig.svg'
              alt='Google Pay'
              width={60}
              height={32}
              unoptimized
            />
            <Image
              className={styles.logoApplePay}
              src='/apple_orig.svg'
              alt='Apple Pay'
              width={50}
              height={32}
              unoptimized
            />
          </div>
        </div>
      </section>

      <section
        className={styles.outcomes}
        data-journey-section='techdown'
        aria-labelledby='outcomes-heading'
      >
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>
            Varme som tilpasser seg dagen
          </p>
          <h2 id='outcomes-heading'>
            Hold varmen. Bli ute lenger.
          </h2>
          <p>
            Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg
            for terrasse, hytte, båt og bobil.
          </p>
        </div>
        <ul className={styles.benefits}>
          <li>
            <Sofa aria-hidden='true' />
            <div>
              <strong>Bli sittende ute lenger</strong>
              <span>
                Fullengdemodus gir et varmt, heldekkende plagg
                når du sitter i ro.
              </span>
            </div>
          </li>
          <li>
            <PersonStanding aria-hidden='true' />
            <div>
              <strong>Behold varmen når du beveger deg</strong>
              <span>
                Hev lengden eller bruk parkasmodus når du skal gå
                uten å ta av plagget.
              </span>
            </div>
          </li>
          <li>
            <SlidersHorizontal aria-hidden='true' />
            <div>
              <strong>Juster plagget til kroppen</strong>
              <span>
                Innvendig snorstramming i livet gjør passformen
                justerbar.
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}
