import TechDownFullLength from '@/assets/images/techdown/TechDown-1200x1200-4.webp'
import TechDownCoast from '@/assets/images/techdown/TechDown-Kyst-W-1600x1600.webp'
import TechDownAdjusted from '@/assets/images/techdown/utekos-techdown-halvfigur-forfra-1600x1600.webp'
import Image, { type StaticImageData } from 'next/image'
import type { ReactNode } from 'react'
import styles from './TechDownEditorialSections.module.css'

type TechDownModesSectionProps = { children: ReactNode }

type Mode = {
  alt: string
  description: string
  image: StaticImageData
  name: string
}

const modes: readonly Mode[] = [
  {
    alt: 'Kvinne sitter ute med Utekos TechDown i full lengde',
    description: 'Pakk bena helt inn når du sitter i ro.',
    image: TechDownFullLength,
    name: 'Fullengdemodus'
  },
  {
    alt: 'Utekos TechDown festet opp til en kortere lengde',
    description: 'Fest lengden opp når du vil bevege deg.',
    image: TechDownAdjusted,
    name: 'Oppjustert modus'
  },
  {
    alt: 'Kvinne bruker overdelen av Utekos TechDown som parkas',
    description: 'Bruk overdelen som parkas på korte turer.',
    image: TechDownCoast,
    name: 'Parkasmodus'
  }
]

export function TechDownModesSection({
  children
}: TechDownModesSectionProps) {
  return (
    <section
      aria-labelledby='ett-plagg-tre-måter-å-holde-varmen'
      className={`${styles.section} ${styles.modesSection}`}
    >
      <div className={styles.sectionFrame}>
        <div className={`${styles.intro} ${styles.reveal}`}>
          {children}
        </div>

        <div className={styles.modeGallery}>
          {modes.map((mode, index) => (
            <figure
              className={`${styles.modeFigure} ${index === 0 ? styles.modeFigurePrimary : ''} ${styles.reveal}`}
              key={mode.name}
            >
              <div className={styles.mediaBezel}>
                <div className={styles.modeImageFrame}>
                  <Image
                    alt={mode.alt}
                    className={styles.modeImage}
                    fill
                    sizes={
                      index === 0 ?
                        '(max-width: 767px) 100vw, 60vw'
                      : '(max-width: 767px) 100vw, 36vw'
                    }
                    src={mode.image}
                  />
                </div>
              </div>
              <figcaption className={styles.modeCaption}>
                <span className={styles.modeNumber}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <strong>{mode.name}</strong>
                  <span>{mode.description}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
