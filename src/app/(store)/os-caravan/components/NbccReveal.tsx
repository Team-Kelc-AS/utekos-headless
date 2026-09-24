'use client'

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps
} from 'motion/react'
import type { ReactNode } from 'react'

const revealEase = [0.22, 1, 0.36, 1] as const

const revealVariants = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 }
}

const revealViewport = {
  once: true,
  amount: 0.12,
  margin: '0px 0px -18% 0px'
} as const

type NbccRevealProps = {
  children: ReactNode
  className?: string
  /** Use inside NbccRevealGroup for staggered children. */
  item?: boolean
} & Omit<
  HTMLMotionProps<'div'>,
  | 'children'
  | 'className'
  | 'initial'
  | 'animate'
  | 'whileInView'
  | 'viewport'
  | 'variants'
  | 'transition'
>

export function NbccReveal({
  children,
  className,
  item = false,
  ...rest
}: NbccRevealProps) {
  const reducedMotion = useReducedMotion()
  const transition = {
    duration: reducedMotion ? 0 : 0.65,
    ease: revealEase
  }

  if (item) {
    return (
      <motion.div
        className={className}
        variants={revealVariants}
        transition={transition}
        {...rest}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? 'visible' : 'hidden'}
      whileInView='visible'
      viewport={revealViewport}
      variants={revealVariants}
      transition={transition}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

type NbccRevealGroupProps = {
  children: ReactNode
  className?: string
} & Omit<
  HTMLMotionProps<'div'>,
  | 'children'
  | 'className'
  | 'initial'
  | 'animate'
  | 'whileInView'
  | 'viewport'
  | 'variants'
>

export function NbccRevealGroup({
  children,
  className,
  ...rest
}: NbccRevealGroupProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? 'visible' : 'hidden'}
      whileInView='visible'
      viewport={revealViewport}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reducedMotion ? 0 : 0.08
          }
        }
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
