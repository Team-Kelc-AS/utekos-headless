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
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { SkreddersyMotionProvider } from './SkreddersyMotionProvider'
import {
  revealGroup,
  revealItem,
  revealItemLeft,
  revealScale,
  skreddersyEase,
  skreddersyViewport
} from './skreddersyMotionVariants'

const content = {
  dry: {
    label: 'Tørt klima',
    title: 'Luftlommer holder på varmen',
    desc: 'CloudWeave™ består av syntetiske fibre som skaper isolerende luftlommer. Det gir et varmt og luftig fyll i tørre forhold.',
    icon: (
      <ShieldCheck
        className='dark:text-dark-accent size-6 text-accent'
        aria-hidden
      />
    ) // Varm farge for tørt klima
  },
  wet: {
    label: 'Fuktig klima',
    title: 'Bevarer spenst og loft',
    desc: 'Et varmt og allsidig 3-i-1-plagg for terrasse, hytte, båt og bobil.',
    icon: (
      <Waves
        className='dark:text-dark-primary size-6 text-primary'
        aria-hidden
      />
    ) // Kald/fuktig farge for vått klima
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
    const nextPosition = clampPercentage((x / rect.width) * 100)
    setPosition(nextPosition)
  }

  const schedulePositionUpdate = (clientX: number) => {
    pendingClientXRef.current = clientX

    if (animationFrameRef.current !== null) {
      return
    }

    animationFrameRef.current = window.requestAnimationFrame(
      () => {
        animationFrameRef.current = null

        const pendingClientX = pendingClientXRef.current
        pendingClientXRef.current = null

        if (pendingClientX === null) {
          return
        }

        updatePositionFromClientX(pendingClientX)
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
    if (!isDraggingRef.current) return
    schedulePositionUpdate(event.clientX)
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
        className='dark:border-dark-background/10 dark:text-dark-background w-full border-t border-background/10 bg-cloud-dancer py-16 text-background md:py-24 dark:bg-cloud-dancer'
      >
        <div className='mx-auto max-w-5xl px-6'>
          <m.div
            className='mb-16 text-left'
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealGroup}
          >
            <m.span
              className='dark:text-dark-accent mb-3 block font-utekos-text-medium leading-4 text-accent'
              variants={revealItemLeft}
            >
              Teknologi
            </m.span>
            <m.h2
              id='techdown-heading'
              className='leading-heading-level-two mb-6 max-w-[18ch] bg-cloud-dancer font-sans text-4xl font-bold tracking-[-0.01em] text-balance text-background md:text-5xl lg:text-6xl'
              variants={revealScale}
            >
              Når været snur, består varmen
            </m.h2>
            <m.p
              className='leading-text-paragraph max-w-3xl bg-cloud-dancer font-sans text-base text-background md:text-lg'
              variants={revealItem}
            >
              CloudWeave™ fortsetter å gi isolasjon når
              forholdene blir fuktige. Dra linjen for å utforske
              forskjellen på hvordan tradisjonell dun og Utekos
              TechDown™ håndterer fuktighet.
            </m.p>
          </m.div>

          <m.div
            className='dark:border-dark-background/10 dark:bg-dark-foreground dark:text-dark-background mb-5 flex flex-col gap-3 rounded-2xl border border-background/10 bg-foreground p-4 font-utekos-text tracking-normal! text-background md:flex-row md:items-center md:justify-between'
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealItem}
          >
            <label
              htmlFor='techdown-moisture-slider'
              className='font-sans text-base leading-4 md:text-lg'
            >
              Sammenlign tørr og fuktig isolasjon
            </label>
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
              className='dark:accent-dark-primary dark:focus-visible:outline-dark-primary h-2 w-full accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:max-w-sm'
            />
          </m.div>

          <m.div
            className='dark:border-dark-background/5 dark:bg-dark-foreground relative rounded-2xl border border-background/5 bg-foreground p-2 shadow-2xl md:p-4'
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealScale}
          >
            <div
              ref={sliderImageRef}
              className='dark:bg-dark-background relative aspect-4/3 w-full cursor-ew-resize touch-none overflow-hidden rounded-2xl bg-background select-none md:aspect-21/9'
              style={sliderStyle}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={event => {
                if (isDraggingRef.current) {
                  endDrag(event)
                }
              }}
            >
              <div className='absolute inset-0 size-full'>
                <Image
                  src={TechDownWetFiber}
                  alt='Utekos TechDown™-fiber i fuktig vær'
                  fill
                  sizes='(max-width: 1024px) 100vw, 80vw'
                  className='object-cover'
                  draggable={false}
                />
              </div>

              <div
                className='dark:border-dark-foreground/50 absolute inset-0 z-20 overflow-hidden border-r-2 border-foreground/50'
                style={{
                  clipPath:
                    'inset(0 var(--techdown-clip-right) 0 0)'
                }}
              >
                <Image
                  src={TechDownDryFiber}
                  alt='Utekos TechDown™-fiber i tørt vær'
                  fill
                  sizes='(max-width: 1024px) 100vw, 80vw'
                  className='object-cover opacity-90'
                  draggable={false}
                />
              </div>

              <div className='pointer-events-none absolute top-6 right-6 z-10'>
                <BrandBadge
                  tone='neutral'
                  className='h-8 px-4 py-0 text-xs leading-none font-medium shadow-sm backdrop-blur-md'
                >
                  Fuktig vær
                </BrandBadge>
              </div>

              <div className='pointer-events-none absolute top-6 left-6 z-30'>
                <BrandBadge
                  bgColor='var(--card)'
                  fgColor='var(--card-foreground)'
                  className='h-8 px-4 py-0 text-xs leading-none font-medium shadow-lg'
                >
                  Tørt vær
                </BrandBadge>
              </div>

              <div
                className='dark:bg-dark-foreground absolute top-0 bottom-0 z-40 flex w-1 cursor-ew-resize items-center justify-center bg-foreground shadow-[0_0_30px_rgba(0,0,0,0.5)]'
                style={{ left: 'var(--techdown-position)' }}
              >
                <m.div
                  className={[
                    'dark:border-dark-background/10 dark:bg-dark-foreground dark:text-dark-primary flex size-16 -translate-x-1/2 transform items-center justify-center rounded-full border border-background/10 bg-foreground text-primary shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-110 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100',
                    isDragging ? 'scale-105' : ''
                  ].join(' ')}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronsLeftRight
                    size={28}
                    strokeWidth={2.5}
                  />
                </m.div>
              </div>
            </div>
          </m.div>

          <m.div
            className='dark:border-dark-background/10 dark:bg-dark-foreground mt-6 rounded-2xl border border-background/10 bg-foreground p-6 shadow-xl md:p-8'
            initial='hidden'
            whileInView='visible'
            viewport={skreddersyViewport}
            variants={revealItem}
          >
            <AnimatePresence mode='wait' initial={false}>
              <m.div
                key={contentKey}
                className='grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center'
                initial={{
                  opacity: 0,
                  x: isDryView ? 18 : -18,
                  filter: 'blur(3px)'
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  filter: 'blur(0px)'
                }}
                exit={{
                  opacity: 0,
                  x: isDryView ? -18 : 18,
                  filter: 'blur(3px)'
                }}
                transition={{
                  duration: 0.46,
                  ease: skreddersyEase
                }}
              >
                <div>
                  <div className='mb-3 flex items-center gap-2 text-primary'>
                    <span
                      className='inline-flex shrink-0'
                      aria-hidden
                    >
                      {currentContent.icon}
                    </span>
                    <span className='font-utekos-text-medium text-xs font-medium tracking-[0.08em] text-primary uppercase'>
                      {currentContent.label}
                    </span>
                  </div>

                  <h3 className='font-google-sans dark:text-dark-background font-sans text-2xl leading-[1.05] font-semibold tracking-[-0.01em] text-background md:text-4xl'>
                    {currentContent.title}
                  </h3>
                </div>

                <div>
                  <p className='leading-text-paragraph dark:text-dark-background/90 font-sans text-base text-background/90 md:text-lg'>
                    {currentContent.desc}
                  </p>
                </div>
              </m.div>
            </AnimatePresence>
          </m.div>
        </div>
      </section>
    </SkreddersyMotionProvider>
  )
}
