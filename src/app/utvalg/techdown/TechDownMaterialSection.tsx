import TechDownDryMacro from '@/assets/images/techdown/techdown-dry-macro.webp'
import TechDownWetMacro from '@/assets/images/techdown/techdown-wet-macro.webp'
import Image from 'next/image'
import type { ReactNode } from 'react'
import styles from './TechDownEditorialSections.module.css'

type TechDownMaterialSectionProps = { children: ReactNode }

export function TechDownMaterialSection({
  children
}: TechDownMaterialSectionProps) {
  return (
    <section
      aria-labelledby='valgt-for-rå-skiftende-luft'
      className={`${styles.section} ${styles.materialSection}`}
    >
      <div
        className={`${styles.materialFrame} ${styles.reveal}`}
      >
        <div className={styles.materialVisual}>
          <figure className={styles.macroFigure}>
            <Image
              alt='Nærbilde av tørre CloudWeave-fibre i Utekos TechDown'
              className={styles.macroImage}
              fill
              sizes='(max-width: 1023px) 100vw, 54vw'
              src={TechDownDryMacro}
            />
            <figcaption className={styles.macroLabel}>
              Tørt
            </figcaption>
          </figure>

          <figure
            className={`${styles.macroFigure} ${styles.macroInset}`}
          >
            <Image
              alt='Nærbilde av CloudWeave-fibre med vanndråper'
              className={styles.macroImage}
              fill
              sizes='(max-width: 639px) 42vw, 24vw'
              src={TechDownWetMacro}
            />
            <figcaption className={styles.macroLabel}>
              Fuktig
            </figcaption>
          </figure>
        </div>

        <div className={styles.materialCopy}>{children}</div>
      </div>
    </section>
  )
}
