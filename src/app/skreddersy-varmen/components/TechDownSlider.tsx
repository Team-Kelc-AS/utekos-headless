// Path: src/app/skreddersy-varmen/components/TechDownSlider.tsx

'use client'

import Image from 'next/image'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent
} from 'react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import {
  ChevronsLeftRight,
  ShieldCheck,
  Waves
} from 'lucide-react'
import TechDownDryFiber from '@/assets/images/techdown/techdown-dry-macro.webp'
import TechDownWetFiber from '@/assets/images/techdown/techdown-wet-macro.webp'
import { SkreddersyMotionProvider } from './SkreddersyMotionProvider'
import {
  revealGroup,
  revealItem,
  revealItemLeft,
  revealScale,
  skreddersyEase,
  skreddersyViewport
} from './skreddersyMotionVariants'
import styles from './TechDownSlider.module.css'

const content = {
  dry: {
    label: 'Tørt klima',
    title: 'Luftlommer holder på varmen',
    desc: 'CloudWeave™ består av syntetiske fibre som skaper isolerende luftlommer. Det gir et varmt og luftig fyll i tørre forhold.',
    icon: (
      <ShieldCheck className={styles.iconGlyph} aria-hidden />
    )
  },
  wet: {
    label: 'Fuktig klima',
    title: 'Bevarer spenst og loft',
    desc: 'Et varmt og allsidig 3-i-1-plagg for terrasse, hytte, båt og bobil.',
    icon: <Waves className={styles.iconGlyph} aria-hidden />
  }
} as const

type ContentKey = keyof typeof content

function clampPercentage(value: number) {
  return Math.min(Math.max(value, 0), 100)
}

export function TechDownSlider() {
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const sliderImageRef = useRef<HTMLDivElement>(null)
  const dragRectRef = useRef<DOMRect | null>(null)
  const isDraggingRef = useRef(false)
  const pendingClientXRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const isDryView = position > 50
  const contentKey: ContentKey = isDryView ? 'dry' : 'wet'
  const currentContent = content[contentKey]

  const updatePositionFromClientX = (clientX: number) => {
    const rect = dragRectRef.current
    if (!rect || rect.width <= 0) return

    const x = clientX - rect.left
    setPosition(clampPercentage((x / rect.width) * 100))
  }

  const schedulePositionUpdate = (clientX: number) => {
    pendingClientXRef.current = clientX

    if (animationFrameRef.current !== null) return

    animationFrameRef.current = window.requestAnimationFrame(
      () => {
        animationFrameRef.current = null

        const pendingClientX = pendingClientXRef.current
        pendingClientXRef.current = null

        if (pendingClientX !== null) {
          updatePositionFromClientX(pendingClientX)
        }
      }
    )
  }

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragRectRef.current =
      event.currentTarget.getBoundingClientRect()
    isDraggingRef.current = true
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    schedulePositionUpdate(event.clientX)
  }

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      schedulePositionUpdate(event.clientX)
    }
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false
    dragRectRef.current = null
    pendingClientXRef.current = null
    setIsDragging(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const sliderStyle = {
    '--techdown-position': `${position}%`,
    '--techdown-clip-right': `${100 - position}%`
  } as CSSProperties

  return (
    <SkreddersyMotionProvider>
      <section
        aria-labelledby='techdown-heading'
        className={styles.section}
        data-techdown-technology
      >
        <div className={styles.shell}>
          <m.header
            className={styles.header}
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealGroup}
          >
            <div className={styles.titleBlock}>
              <m.span
                className={styles.eyebrow}
                variants={revealItemLeft}
              >
                Teknologi
              </m.span>
              <m.h2
                id='techdown-heading'
                className={styles.heading}
                variants={revealScale}
              >
                Når været snur,
                <span> består varmen</span>
              </m.h2>
            </div>

            <m.div
              className={styles.introduction}
              variants={revealItem}
            >
              <p>
                CloudWeave™ fortsetter å gi isolasjon når
                forholdene blir fuktige. Utforsk forskjellen på
                hvordan tradisjonell dun og Utekos TechDown™
                håndterer fuktighet.
              </p>
              <p className={styles.gestureCue}>
                <ChevronsLeftRight aria-hidden />
                Dra skillet gjennom materialet
              </p>
            </m.div>
          </m.header>

          <m.div
            className={styles.instrument}
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealScale}
            data-techdown-instrument
          >
            <div
              ref={sliderImageRef}
              className={styles.visual}
              style={sliderStyle}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={event => {
                if (isDraggingRef.current) endDrag(event)
              }}
            >
              <div className={styles.imageLayer}>
                <Image
                  src={TechDownWetFiber}
                  alt='Utekos TechDown™-fiber i fuktig vær'
                  fill
                  sizes='(max-width: 1023px) calc(100vw - 2rem), 80rem'
                  className={styles.image}
                  draggable={false}
                />
              </div>

              <div
                className={`${styles.imageLayer} ${styles.dryLayer} ${isDragging ? styles.dragging : ''}`}
              >
                <Image
                  src={TechDownDryFiber}
                  alt='Utekos TechDown™-fiber i tørt vær'
                  fill
                  sizes='(max-width: 1023px) calc(100vw - 2rem), 80rem'
                  className={styles.image}
                  draggable={false}
                />
              </div>

              <span
                className={`${styles.visualLabel} ${styles.dryLabel}`}
              >
                Tørt vær
              </span>
              <span
                className={`${styles.visualLabel} ${styles.wetLabel}`}
              >
                Fuktig vær
              </span>

              <div className={styles.divider} aria-hidden>
                <span
                  className={`${styles.handle} ${isDragging ? styles.handleDragging : ''}`}
                >
                  <ChevronsLeftRight />
                </span>
              </div>
            </div>

            <div className={styles.controlDock}>
              <div className={styles.controlCopy}>
                <label htmlFor='techdown-moisture-slider'>
                  Sammenlign isolasjonen
                </label>
                <output htmlFor='techdown-moisture-slider'>
                  {Math.round(position)} % tørr side
                </output>
              </div>

              <div className={styles.controlRail}>
                <input
                  id='techdown-moisture-slider'
                  type='range'
                  min={0}
                  max={100}
                  value={position}
                  aria-valuetext={`${Math.round(position)} prosent tørr visning`}
                  onChange={event =>
                    setPosition(
                      clampPercentage(
                        Number(event.currentTarget.value)
                      )
                    )
                  }
                  className={styles.range}
                />
                <div className={styles.rangeLabels} aria-hidden>
                  <span>Fuktig</span>
                  <span>Tørt</span>
                </div>
              </div>
            </div>

            <div className={styles.readout} aria-live='polite'>
              <AnimatePresence mode='wait' initial={false}>
                <m.div
                  key={contentKey}
                  className={styles.readoutMotion}
                  initial={{
                    opacity: 0,
                    x: isDryView ? 14 : -14
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isDryView ? -14 : 14 }}
                  transition={{
                    duration: 0.36,
                    ease: skreddersyEase
                  }}
                >
                  <div className={styles.readoutHeading}>
                    <span className={styles.icon} aria-hidden>
                      {currentContent.icon}
                    </span>
                    <div>
                      <span className={styles.readoutLabel}>
                        {currentContent.label}
                      </span>
                      <h3>{currentContent.title}</h3>
                    </div>
                  </div>
                  <p className={styles.description}>
                    {currentContent.desc}
                  </p>
                </m.div>
              </AnimatePresence>
            </div>
          </m.div>
        </div>
      </section>
    </SkreddersyMotionProvider>
  )
}
