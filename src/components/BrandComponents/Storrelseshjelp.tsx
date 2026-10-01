import Link from 'next/link'
import { TECH_DOWN_PUBLIC_SIZE_DEFINITIONS } from '@/lib/products/techDownSizes'
import { Storrelsesvalg } from './Storrelsesvalg'
import styles from './Storrelseshjelp.module.css'

type StorrelseshjelpProps = { id?: string }

/** Størrelseshjelp for Utekos TechDown™. Viser plaggmål, men velger ikke en Shopify-variant. */
export function Storrelseshjelp({ id }: StorrelseshjelpProps) {
  const sizes = TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(size => ({
    size: size.size,
    heightGuide: size.heightGuide,
    measurements: size.measurements
  }))

  return (
    <section
      id={id}
      className={styles.section}
      aria-label='Størrelseshjelp for Utekos TechDown™'
    >
      <div className={styles.layout}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Utekos TechDown™</p>
          <h2>Finn størrelsen du vil trives i.</h2>
          <p className={styles.description}>
            Høyden din er et utgangspunkt. Sammenlign også
            plaggmålene med et plagg du liker passformen på.
          </p>
          <Link
            className={styles.guideLink}
            href='/handlehjelp/storrelsesguide#techdown'
          >
            Se hele størrelsesguiden hos Utekos
          </Link>
        </div>

        <div className={styles.guide}>
          <h3>Veiledende høyde</h3>
          <Storrelsesvalg sizes={sizes} />
          <p className={styles.footnote}>
            Brystmålet er plaggets bredde når det ligger flatt,
            ikke omkretsen rundt kroppen. Størrelse og
            lagerstatus velger du i nettbutikken.
          </p>
          <p className={styles.phone}>
            Mellom to størrelser?{' '}
            <a href='tel:+4740216343'>Ring oss på 40 21 63 43</a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}

export default Storrelseshjelp
