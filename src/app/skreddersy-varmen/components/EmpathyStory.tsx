import Image, { type StaticImageData } from 'next/image'
import type { ReactNode } from 'react'
import bonfireImage from '../../../assets/images/techdown/SkreddersyVarmen-1.webp'
import chillImage from '../../../assets/images/techdown/UtekosTechDownMElegense.webp'
import type {
  EmpathyMediaImageSrc,
  EmpathyMediaSceneContent,
  EmpathyMediaSceneId,
  SkreddersyVarmenPageContent
} from '../data/skreddersyVarmenPageModel'
import styles from './SkreddersyVarmenTheatre.module.css'

const empathyImages: Record<
  EmpathyMediaImageSrc,
  StaticImageData
> = {
  '/src/assets/images/techdown/SkreddersyVarmen-1.webp':
    bonfireImage,
  '/src/assets/images/techdown/UtekosTechDownMElegense.webp':
    chillImage
}

const mediaFrameClasses: Record<EmpathyMediaSceneId, string> = {
  bonfire: styles.empathyFrameBonfire!,
  chill: styles.empathyFrameChill!
}

function EmpathyMediaVisual({
  scene
}: {
  scene: EmpathyMediaSceneContent
}) {
  return (
    <div className={styles.empathyMediaInner}>
      <div
        className={`${styles.empathyMediaFrame} ${mediaFrameClasses[scene.id]}`}
      >
        <Image
          src={empathyImages[scene.imageSrc]}
          alt={scene.imageAlt}
          fill
          sizes='(max-width: 1023px) calc(100vw - 2rem), 50vw'
          quality={75}
          placeholder='blur'
          className={styles.empathyMediaImage}
        />
      </div>

      <p className={styles.empathyMediaStatement}>
        {scene.copy}
      </p>
    </div>
  )
}

export function EmpathyStory({
  content,
  children
}: {
  content: SkreddersyVarmenPageContent['empathy']
  children?: ReactNode
}) {
  const moment = content.scenes[0]
  const recognition = content.scenes[1]
  const bonfireCopy = content.scenes[2]
  const bonfire = content.scenes[3]
  const chill = content.scenes[4]
  const question = content.scenes[5]

  if (
    moment?.kind !== 'text' ||
    recognition?.kind !== 'text' ||
    bonfireCopy?.kind !== 'text' ||
    bonfire?.kind !== 'media' ||
    chill?.kind !== 'media' ||
    question?.kind !== 'text'
  ) {
    throw new Error(
      'Empatifortellingen mangler en validert scene.'
    )
  }

  return (
    <section
      aria-labelledby='empathy-heading'
      className={styles.empathyStory}
    >
      <div
        className={styles.empathyTextTheatre}
        data-empathy-text-theatre
      >
        <div
          className={styles.empathyTextSticky}
          data-empathy-reveal-surface
        >
          <div
            className={`${styles.empathyTextScene} ${styles.empathyMomentScene}`}
            data-empathy-scene='moment'
          >
            <div className={styles.empathyTextInner}>
              <h2
                id='empathy-heading'
                className={styles.empathyManifestoText}
                data-empathy-reveal-heading
              >
                {moment.copy}
              </h2>
            </div>
          </div>

          <div
            className={`${styles.empathyTextScene} ${styles.empathyRecognitionScene}`}
            data-empathy-scene='recognition'
          >
            <div className={styles.empathyTextInner}>
              <p className={styles.empathyManifestoText}>
                {recognition.copy}
              </p>
            </div>
          </div>

          <div
            className={`${styles.empathyTextScene} ${styles.empathyBonfireCopyScene}`}
            data-empathy-scene='bonfire-copy'
          >
            <div className={styles.empathyTextInner}>
              <p
                className={`${styles.empathyManifestoText} ${styles.empathyBonfireCopyText}`}
              >
                {bonfireCopy.copy}
              </p>
            </div>
          </div>

          <article
            className={`${styles.empathyTextScene} ${styles.empathyBonfireMediaScene}`}
            data-empathy-media-scene='bonfire'
            data-empathy-horizontal-panel
          >
            <EmpathyMediaVisual scene={bonfire} />
          </article>
        </div>
      </div>

      <div className={styles.empathyMediaFlow}>
        <div
          className={styles.empathyQuestionAnswerTheatre}
          data-empathy-question-answer-theatre
        >
          <div
            className={styles.empathyQuestionAnswerSticky}
            data-empathy-question-answer-sticky
          >
            <article
              className={`${styles.empathyMediaScene} ${styles.empathyQuestionCurtain}`}
              data-empathy-media-scene='chill'
              data-empathy-question-curtain
            >
              <EmpathyMediaVisual scene={chill} />
            </article>

            <div
              className={`${styles.empathyTextScene} ${styles.empathyQuestionScene}`}
              data-empathy-scene='question'
            >
              <div className={styles.empathyTextInner}>
                <p className={styles.empathyManifestoText}>
                  {question.copy}
                </p>
              </div>
            </div>

            <div
              className={styles.empathyAnswerPanel}
              data-empathy-answer-panel
            >
              <div className={styles.empathyAnswerInner}>
                <p className={styles.empathyAnswerOpening}>
                  {content.resolution.opening}
                </p>
                <ol
                  className={styles.empathyAnswerSteps}
                  role='list'
                >
                  {content.resolution.steps.map(
                    (step, index) => (
                      <li
                        key={step}
                        className={styles.empathyAnswerStep}
                        data-empathy-answer-step={index + 1}
                      >
                        {step}
                      </li>
                    )
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div
          className={styles.empathyResolutionTransition}
          data-empathy-resolution-transition
        >
          <div
            className={styles.empathyResolutionTrack}
            data-empathy-resolution-track
          >
            <div
              className={styles.empathyResolution}
              data-empathy-resolution
            >
              <div className={styles.empathyResolutionInner}>
                <p
                  className={styles.empathyResolutionBody}
                  data-empathy-resolution-statement
                >
                  {content.resolution.statement}
                </p>
                <p
                  className={styles.empathyResolutionEmphasis}
                  data-empathy-resolution-emphasis
                >
                  {content.resolution.emphasis}
                </p>
                <p
                  className={styles.empathyResolutionClosing}
                  data-empathy-resolution-closing
                >
                  {content.resolution.closing}
                </p>
              </div>

              <div
                id='section-solution'
                aria-hidden
                className={styles.empathySolutionAnchor}
              />
            </div>
          </div>

          {children ?
            <div
              className={styles.empathyContinuation}
              data-empathy-continuation
            >
              {children}
            </div>
          : null}
        </div>
      </div>
    </section>
  )
}
