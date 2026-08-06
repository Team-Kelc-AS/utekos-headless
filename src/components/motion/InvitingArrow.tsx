'use client'

import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils/className'

type InvitingArrowProps = {
  className?: string
}

export function InvitingArrow({ className }: InvitingArrowProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.span
      aria-hidden
      className='inline-flex'
      {...(shouldReduceMotion ?
        {}
      : {
          animate: { x: [0, 5, 0] },
          transition: {
            duration: 1.85,
            ease: [0.45, 0, 0.55, 1] as const,
            repeat: Infinity,
            repeatType: 'loop' as const
          }
        })}
    >
      <ArrowRight
        className={cn('size-4 text-current', className)}
      />
    </motion.span>
  )
}
