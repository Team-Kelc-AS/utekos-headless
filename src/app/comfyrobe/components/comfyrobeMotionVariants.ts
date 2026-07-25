import type { Variants } from 'motion/react'

export const comfyrobeEase = [0.22, 1, 0.36, 1] as const

export const comfyrobeViewport = {
  once: true,
  amount: 0.18,
  margin: '0px 0px -8% 0px'
} as const

export const comfyrobeRevealGroup = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 }
  }
} satisfies Variants

export const comfyrobeRevealItem = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: comfyrobeEase }
  }
} satisfies Variants

export const comfyrobeRevealScale = {
  hidden: { opacity: 0, scale: 0.975 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.72, ease: comfyrobeEase }
  }
} satisfies Variants
