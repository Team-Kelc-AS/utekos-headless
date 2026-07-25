'use client'

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import type { ReactNode } from 'react'

export function ComfyrobeMotionProvider({
  children
}: {
  children: ReactNode
}) {
  return (
    <MotionConfig reducedMotion='user'>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
