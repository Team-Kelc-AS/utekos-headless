'use client'

import { motion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

const springEase = [0.22, 1, 0.36, 1] as const

export function TerraceMotionProvider({
  children
}: {
  children: ReactNode
}) {
  return (
    <MotionConfig reducedMotion='user'>{children}</MotionConfig>
  )
}

export function MotionReveal({
  children,
  className,
  delay = 0,
  y = 24,
  amount = 0.22
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  amount?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.65, delay, ease: springEase }}
    >
      {children}
    </motion.div>
  )
}

export function MotionCard({
  children,
  className,
  delay = 0,
  y = 24
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  return (
    <motion.article
      className={cn('h-full', className)}
      initial={{ opacity: 1, y }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: 0.58, delay, ease: springEase }}
    >
      {children}
    </motion.article>
  )
}

export function MotionHeroCard({
  children,
  className,
  delay = 0
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.article
      className={cn('h-full', className)}
      initial={{ opacity: 1, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -8, scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.72, delay, ease: springEase }}
    >
      {children}
    </motion.article>
  )
}
