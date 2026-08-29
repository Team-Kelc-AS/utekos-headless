import Image, { getImageProps } from 'next/image'
import { THREE_MODE_SCENE_ASSETS } from './Steps'
import {
  parseThreeModeScenes,
  type SkreddersyVarmenPageContent,
  type ThreeModeScene
} from '../data/skreddersyVarmenPageModel'
import styles from './SectionThreeInOne.module.css'

type SectionThreeInOneProps = {
  content: SkreddersyVarmenPageContent['threeInOne']
}

function ModeScene({ scene }: { scene: ThreeModeScene }) {
  const asset = THREE_MODE_SCENE_ASSETS[scene.id]
  const { props: desktopImage } = getImageProps({
    src: asset.desktop,
    alt: '',
    fill: true,
    quality: 75,
    sizes: '(min-width: 1024px) min(54vw, 860px), 100vw'
  })

  return (
    <article
      className={styles.scene}
      data-mode-scene={scene.id}
      data-mode-transition={scene.transition}
    >
      <div className={styles.mediaShell}>
        <div className={styles.mediaCore}>
          <picture className={styles.picture}>
            <source
              media='(min-width: 1024px)'
              srcSet={desktopImage.srcSet}
              sizes={desktopImage.sizes}
            />
            <Image
              src={asset.mobile}
              alt={scene.imageAlt}
              fill
              loading='lazy'
              quality={75}
              sizes='(max-width: 1023px) calc(100vw - 32px), min(54vw, 860px)'
              className={
                asset.objectFit === 'contain' ?
                  styles.imageContain
                : styles.imageCover
              }
            />
          </picture>
        </div>
      </div>

      <div className={styles.copy}>
        <p className={styles.modeLabel}>
          <span aria-hidden>{scene.stepNumber}</span>
          <span>{scene.modeName}</span>
        </p>
        <h3 className={styles.sceneTitle}>{scene.title}</h3>
        <p className={styles.description}>{scene.description}</p>
      </div>
    </article>
  )
}

export function SectionThreeInOne({
  content
}: SectionThreeInOneProps) {
  const scenes = parseThreeModeScenes(content.scenes)

  return (
    <section
      aria-labelledby='threeinone-heading'
      className={styles.section}
    >
      <div
        className={styles.introductionTrack}
        data-three-in-one-intro-track
      >
        <header
          className={styles.introduction}
          data-three-in-one-surface
        >
          <div className={styles.introductionContent}>
            <p className={styles.eyebrow}>{content.eyebrow}</p>
            <h2
              id='threeinone-heading'
              className={styles.heading}
            >
              {content.heading}
            </h2>
            <p className={styles.lead}>{content.introduction}</p>
          </div>
        </header>
      </div>

      <div className={styles.track}>
        <div className={styles.stage}>
          {scenes.map(scene => (
            <ModeScene key={scene.id} scene={scene} />
          ))}
        </div>
      </div>
    </section>
  )
}
