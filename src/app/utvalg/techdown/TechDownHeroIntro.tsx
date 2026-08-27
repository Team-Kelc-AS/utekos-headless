import OrangeLogoHorizontal from '@public/OrangeLogoHorizontal.svg'
import Header from '@/components/header/Header'
import { mainMenu } from '@/db/config/menu.config'
import Image from 'next/image'
import { TechDownIntroReplay } from './TechDownIntroReplay'
import styles from './TechDownHeroIntro.module.css'

const CONTENT_ANCHOR_ID = 'techdown-content'
const HERO_HEADING_ID = 'techdown-hero-heading'

export function TechDownHeroIntro() {
  return (
    <>
      <section
        aria-labelledby={HERO_HEADING_ID}
        className={styles.hero}
        data-techdown-intro
      >
        <TechDownIntroReplay />

        <div
          aria-hidden
          className={styles.junglePanel}
          data-techdown-part='jungle'
        />

        <div
          aria-hidden
          className={styles.openingLogo}
          data-techdown-part='opening-logo'
        >
          <Image
            src={OrangeLogoHorizontal}
            alt=''
            preload
            sizes='(max-width: 639px) 82vw, (max-width: 1023px) 58vw, 38vw'
            className={styles.openingLogoImage}
          />
        </div>

        <div
          className={styles.headerShell}
          data-techdown-part='header'
        >
          <Header menu={mainMenu} />
        </div>

        <div className={styles.copyArea}>
          <h1
            id={HERO_HEADING_ID}
            className={styles.headline}
            data-techdown-part='headline'
          >
            Skreddersy varmen
          </h1>

          <a
            href={`#${CONTENT_ANCHOR_ID}`}
            className={styles.scrollCue}
            data-techdown-part='scroll-cue'
          >
            <span>Se mer</span>
            <svg
              aria-hidden
              className={styles.scrollCueArrow}
              viewBox='0 0 24 24'
              fill='none'
            >
              <path
                d='M12 4v15m0 0 6-6m-6 6-6-6'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='1.75'
              />
            </svg>
          </a>
        </div>
      </section>

      <div
        id={CONTENT_ANCHOR_ID}
        aria-hidden
        className={styles.contentAnchor}
      />
    </>
  )
}
