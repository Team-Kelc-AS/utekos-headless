'use client'

import { Children, type ReactNode } from 'react'
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  useReducedMotion,
  type Variants
} from 'motion/react'
import * as m from 'motion/react-m'
import { cn } from '@/lib/utils/className'

export type HytteSeasonAnimationPreset =
  | 'push-word'
  | 'scroll'
  | 'zoom-in'
  | 'push-line'

const seasonItemMotion = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.06,
      duration: 0.46,
      ease: [0.22, 1, 0.36, 1]
    }
  }),
  hover: { y: -4, transition: { duration: 0.24 } }
} satisfies Variants

const pushWordMotion = {
  hidden: { opacity: 0, y: '100%' },
  visible: (index: number) => ({
    opacity: 1,
    y: '0%',
    transition: {
      delay: index * 0.08,
      duration: 0.54,
      ease: [0.22, 1, 0.36, 1]
    }
  })
} satisfies Variants

const zoomWordMotion = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.07,
      type: 'spring',
      stiffness: 420,
      damping: 28,
      mass: 0.72
    }
  })
} satisfies Variants

const pushLineMotion = {
  hidden: { opacity: 0, y: '100%' },
  visible: (index: number) => ({
    opacity: 1,
    y: '0%',
    transition: {
      delay: index * 0.16,
      duration: 0.58,
      ease: [0.22, 1, 0.36, 1]
    }
  })
} satisfies Variants

const textViewport = {
  once: true,
  amount: 0.2,
  margin: '0px 0px -48px 0px'
} as const

const textBlockClassName =
  'mx-auto flex w-full max-w-[18ch] flex-col items-center justify-center gap-1 text-center font-[family-name:var(--font-google-sans)] text-[1.5rem] leading-[0.96] font-google-sans font-bold tracking-normal text-card-foreground  min-[390px]:text-[1.75rem] sm:text-4xl lg:text-[2.5rem] xl:text-5xl'

const textLineClassName = 'block max-w-full whitespace-nowrap'

const splitWords = (text: string) => text.trim().split(/\s+/)

interface HytteSeasonAnimatedTextProps {
  description: string
  preset: HytteSeasonAnimationPreset
  title: string
}

interface HytteSeasonsAnimatorProps {
  children: ReactNode
  className?: string
  itemClassName?: string
  seasonValues: readonly string[]
}

export function HytteSeasonAnimatedText({
  description,
  preset,
  title
}: HytteSeasonAnimatedTextProps) {
  switch (preset) {
    case 'push-word':
      return (
        <WordPresetText
          description={description}
          lineVariant='push'
          title={title}
        />
      )
    case 'scroll':
      return (
        <ScrollPresetText
          description={description}
          title={title}
        />
      )
    case 'zoom-in':
      return (
        <WordPresetText
          description={description}
          lineVariant='zoom'
          title={title}
        />
      )
    case 'push-line':
      return (
        <PushLinePresetText
          description={description}
          title={title}
        />
      )
  }
}

export function HytteSeasonsAnimator({
  children,
  className,
  itemClassName,
  seasonValues
}: HytteSeasonsAnimatorProps) {
  const childrenArray = Children.toArray(children)
  const shouldReduceMotion = useReducedMotion()
  const hoverMotionProps =
    shouldReduceMotion ? {} : { whileHover: 'hover' as const }

  return (
    <MotionConfig reducedMotion='user'>
      <LazyMotion features={domAnimation} strict>
        <m.ul className={className}>
          {childrenArray.map((child, index) => (
            <m.li
              key={`hytte-season-${seasonValues[index] ?? index}`}
              className={itemClassName}
              data-season={seasonValues[index]}
              custom={index}
              initial='hidden'
              variants={seasonItemMotion}
              viewport={{
                once: true,
                amount: 0.2,
                margin: '0px 0px -72px 0px'
              }}
              whileInView='visible'
              {...hoverMotionProps}
            >
              {child}
            </m.li>
          ))}
        </m.ul>
      </LazyMotion>
    </MotionConfig>
  )
}

function WordPresetText({
  description,
  lineVariant,
  title
}: {
  description: string
  lineVariant: 'push' | 'zoom'
  title: string
}) {
  const titleWords = splitWords(title)
  const descriptionWords = splitWords(description)
  const variant =
    lineVariant === 'push' ? pushWordMotion : zoomWordMotion

  return (
    <MotionConfig reducedMotion='user'>
      <LazyMotion features={domAnimation} strict>
        <m.div
          className={textBlockClassName}
          data-season-copy={
            lineVariant === 'push' ? 'push-word' : 'zoom-in'
          }
          initial='hidden'
          viewport={textViewport}
          whileInView='visible'
        >
          <h3
            className={textLineClassName}
            data-season-line='title'
          >
            <span className='inline-block max-w-full whitespace-nowrap'>
              {titleWords.map((word, index) => (
                <m.span
                  key={`${title}-${word}-${index}`}
                  className={cn(
                    'inline-block will-change-transform',
                    index < titleWords.length - 1 &&
                      'mr-[0.18em]'
                  )}
                  custom={index}
                  variants={variant}
                >
                  {word}
                </m.span>
              ))}
            </span>
          </h3>

          <p
            className={textLineClassName}
            data-season-line='description'
          >
            <span className='inline-block max-w-full whitespace-nowrap'>
              {descriptionWords.map((word, index) => (
                <m.span
                  key={`${description}-${word}-${index}`}
                  className={cn(
                    'inline-block will-change-transform',
                    index < descriptionWords.length - 1 &&
                      'mr-[0.18em]'
                  )}
                  custom={titleWords.length + index}
                  variants={variant}
                >
                  {word}
                </m.span>
              ))}
            </span>
          </p>
        </m.div>
      </LazyMotion>
    </MotionConfig>
  )
}

function ScrollPresetText({
  description,
  title
}: {
  description: string
  title: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const marqueeMotionProps =
    shouldReduceMotion ?
      {}
    : {
        animate: { x: ['0%', '-50%'] },
        transition: {
          duration: 10,
          ease: 'linear' as const,
          repeat: Infinity
        }
      }

  return (
    <MotionConfig reducedMotion='user'>
      <LazyMotion features={domAnimation} strict>
        <div
          className={cn(
            textBlockClassName,
            'max-w-full overflow-hidden'
          )}
          data-season-copy='scroll'
        >
          <m.div
            className='flex w-[200%] items-center whitespace-nowrap'
            {...marqueeMotionProps}
          >
            <div className='flex min-w-1/2 shrink-0 flex-col items-center justify-center gap-1 px-4'>
              <h3
                className={textLineClassName}
                data-season-line='title'
              >
                {title}
              </h3>
              <p
                className={textLineClassName}
                data-season-line='description'
              >
                {description}
              </p>
            </div>

            <div
              aria-hidden='true'
              className='flex min-w-1/2 shrink-0 flex-col items-center justify-center gap-1 px-4'
            >
              <span className={textLineClassName}>{title}</span>
              <span className={textLineClassName}>
                {description}
              </span>
            </div>
          </m.div>
        </div>
      </LazyMotion>
    </MotionConfig>
  )
}

function PushLinePresetText({
  description,
  title
}: {
  description: string
  title: string
}) {
  const lines = [
    { as: 'h3', text: title },
    { as: 'p', text: description }
  ] as const

  return (
    <MotionConfig reducedMotion='user'>
      <LazyMotion features={domAnimation} strict>
        <m.div
          className={textBlockClassName}
          data-season-copy='push-line'
          initial='hidden'
          viewport={textViewport}
          whileInView='visible'
        >
          {lines.map((line, index) => {
            const Component = line.as

            return (
              <Component
                key={`${line.as}-${line.text}`}
                className='block overflow-hidden whitespace-nowrap'
                data-season-line={
                  line.as === 'h3' ? 'title' : 'description'
                }
              >
                <m.span
                  className={cn(
                    textLineClassName,
                    'will-change-transform'
                  )}
                  custom={index}
                  variants={pushLineMotion}
                >
                  {line.text}
                </m.span>
              </Component>
            )
          })}
        </m.div>
      </LazyMotion>
    </MotionConfig>
  )
}
