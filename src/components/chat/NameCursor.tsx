// Path: src/components/chat/NameCursor.tsx

import { CursorIcon } from '@/components/icon/CursorIcon'
import { cn } from '@/lib/utils/className'
import type { Side } from '@types'
import { motion } from 'motion/react'

export function NameCursor({
  name,
  side,
  color,
  foreground = 'var(--background)',
  className
}: {
  name: string
  side: Side
  color: string
  foreground?: string
  className?: string
}) {
  return (
    <motion.div
      className={cn(
        'absolute z-10 will-change-transform',
        className
      )}
      animate={{ x: [0, 4, -3, -5, 0], y: [0, -3, 5, -3, 0] }}
      transition={{
        duration: 4.8,
        ease: 'easeInOut',
        repeat: Infinity
      }}
      aria-hidden
    >
      <motion.div
        className='flex items-center gap-1.5'
        animate={{
          scale: [1, 1.025, 1],
          opacity: [0.9, 1, 0.9]
        }}
        transition={{
          duration: 2.4,
          ease: 'easeInOut',
          repeat: Infinity
        }}
      >
        <CursorIcon side={side} style={{ color }} />
        <span
          className='rounded-md px-2 py-0.5 font-utekos-text-medium text-xs shadow-sm'
          style={{ backgroundColor: color, color: foreground }}
        >
          {name}
        </span>
      </motion.div>
    </motion.div>
  )
}
