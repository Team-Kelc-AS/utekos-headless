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
      <EmpathyMediaFrame scene={scene} />

      <p className={styles.empathyMediaStatement}>
        {scene.copy}
      </p>
    </div>
  )
}

function EmpathyMediaFrame({
  large = false,
  scene
}: {
  large?: boolean
  scene: EmpathyMediaSceneContent
}) {
  return (
    <div
      className={`${styles.empathyMediaFrame} ${mediaFrameClasses[scene.id]} ${large ? styles.empathyLargeMediaFrame : ''}`}
      data-empathy-image-frame={scene.id}
      {...(large ?
        { 'data-empathy-large-reveal-frame': scene.id }
      : {})}
    >
      <div className={styles.empathyMediaViewport}>
        <Image
          src={empathyImages[scene.imageSrc]}
          alt={scene.imageAlt}
          fill
          loading='lazy'
          sizes={
            large ?
              '(min-width: 768px) 50vw, 16px'
            : '(max-width: 767px) calc(100vw - 2rem), 16px'
          }
          quality={75}
          placeholder='blur'
          className={styles.empathyMediaImage}
        />
      </div>

      {large ?
        <>
          <span
            aria-hidden
            className={`${styles.empathyLargeRevealCover} ${styles.empathyLargeRevealCoverHorizontal}`}
            data-empathy-large-reveal-cover='horizontal'
          />
          <span
            aria-hidden
            className={`${styles.empathyLargeRevealCover} ${styles.empathyLargeRevealCoverVertical}`}
            data-empathy-large-reveal-cover='vertical'
          />
        </>
      : null}
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
    <div className={styles.empathyStory}>
      <section
        aria-labelledby='empathy-heading'
        className={styles.empathyMobile}
        data-empathy-mobile
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby='empathy-heading-large'
        className={styles.empathyLarge}
        data-empathy-large
      >
        <div
          className={styles.empathyLargeTextTheatre}
          data-empathy-large-text-theatre
        >
          <div
            className={styles.empathyLargeTextSticky}
            data-empathy-large-reveal-surface
          >
            <div
              className={`${styles.empathyLargeTextScene} ${styles.empathyLargeMomentScene}`}
              data-empathy-large-scene='moment'
            >
              <div className={styles.empathyLargeTextInner}>
                <h2
                  id='empathy-heading-large'
                  className={styles.empathyLargeManifestoText}
                  data-empathy-large-reveal-heading
                >
                  {moment.copy}
                </h2>
              </div>
            </div>

            <div
              className={`${styles.empathyLargeTextScene} ${styles.empathyLargeRecognitionScene}`}
              data-empathy-large-scene='recognition'
            >
              <div className={styles.empathyLargeTextInner}>
                <p className={styles.empathyLargeManifestoText}>
                  {recognition.copy}
                </p>
              </div>
            </div>

            <div
              className={`${styles.empathyLargeTextScene} ${styles.empathyLargeBonfireCopyScene}`}
              data-empathy-large-scene='bonfire-copy'
            >
              <div className={styles.empathyLargeTextInner}>
                <p className={styles.empathyLargeManifestoText}>
                  {bonfireCopy.copy}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={styles.empathyLargeMediaChain}
          data-empathy-large-media-chain
        >
          <article
            className={`${styles.empathyLargeMediaRow} ${styles.empathyLargeMediaRowBonfire}`}
            data-empathy-large-media-scene='bonfire'
          >
            <EmpathyMediaFrame large scene={bonfire} />
            <p className={styles.empathyLargeMediaStatement}>
              {bonfire.copy}
            </p>
          </article>

          <article
            className={`${styles.empathyLargeMediaRow} ${styles.empathyLargeMediaRowChill}`}
            data-empathy-large-media-scene='chill'
          >
            <p className={styles.empathyLargeMediaStatement}>
              {chill.copy}
            </p>
            <EmpathyMediaFrame large scene={chill} />
          </article>
        </div>

        <div
          className={styles.empathyLargeQuestionAnswerTheatre}
          data-empathy-large-question-answer-theatre
        >
          <div
            className={styles.empathyLargeQuestionAnswerSticky}
            data-empathy-large-question-answer-sticky
          >
            <div
              className={`${styles.empathyLargeQuestionScene} ${styles.empathyLargeTextScene}`}
              data-empathy-large-scene='question'
            >
              <div className={styles.empathyLargeTextInner}>
                <p className={styles.empathyLargeManifestoText}>
                  {question.copy}
                </p>
              </div>
            </div>

            <div
              className={styles.empathyLargeAnswerPanel}
              data-empathy-large-answer-panel
            >
              <div className={styles.empathyLargeAnswerInner}>
                <p className={styles.empathyLargeAnswerOpening}>
                  {content.resolution.opening}
                </p>
                <ol
                  className={styles.empathyLargeAnswerSteps}
                  role='list'
                >
                  {content.resolution.steps.map(
                    (step, index) => (
                      <li
                        key={step}
                        className={styles.empathyLargeAnswerStep}
                        data-empathy-large-answer-step={
                          index + 1
                        }
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
          className={styles.empathyLargeResolutionTrack}
          data-empathy-large-resolution-track
        >
          <div
            className={styles.empathyLargeResolution}
            data-empathy-large-resolution
          >
            <div className={styles.empathyLargeResolutionInner}>
              <p className={styles.empathyLargeResolutionBody}>
                {content.resolution.statement}
              </p>
              <p
                className={styles.empathyLargeResolutionEmphasis}
              >
                {content.resolution.emphasis}
              </p>
              <p
                className={styles.empathyLargeResolutionClosing}
              >
                {content.resolution.closing}
              </p>
            </div>
          </div>
        </div>
      </section>

      {children ?
        <div
          className={styles.empathyContinuation}
          data-empathy-continuation
        >
          {children}
        </div>
      : null}
    </div>
  )
}
