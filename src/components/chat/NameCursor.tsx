// Path: src/components/chat/NameCursor.tsx

import { CursorIcon } from '@/components/icon/CursorIcon'
import { cn } from '@/lib/utils/className'
import type { Side } from '@types'
import { motion } from 'motion/react'

type CursorTone = 'incoming' | 'outgoing'

const cursorToneClasses: Record<
  CursorTone,
  { icon: string; label: string }
> = {
  incoming: {
    icon: 'text-light-teal drop-shadow-[0_6px_14px_color-mix(in_oklch,var(--jungle)_70%,transparent)]',
    label:
      'border-light-teal/45 bg-light-teal text-jungle ring-1 ring-inset ring-foreground/18 shadow-[0_14px_34px_-20px_color-mix(in_oklch,var(--jungle)_88%,transparent)]'
  },
  outgoing: {
    icon: 'text-[oklch(0.5891_0.2029_257.86)] drop-shadow-[0_6px_14px_color-mix(in_oklch,var(--jungle)_70%,transparent)]',
    label:
      'border-foreground/24 bg-[oklch(0.5891_0.2029_257.86)] text-jungle ring-1 ring-inset ring-foreground/20 shadow-[0_14px_34px_-20px_color-mix(in_oklch,var(--jungle)_88%,transparent)]'
  }
}

export function NameCursor({
  name,
  side,
  tone,
  className
}: {
  name: string
  side: Side
  tone: CursorTone
  className?: string
}) {
  const toneClasses = cursorToneClasses[tone]

  return (
    <motion.div
      className={cn(
        'absolute z-10 will-change-transform',
        className
      )}
      animate={{ x: [0, 4, -3, -5, 0], y: [0, -3, 5, -3, 0] }}
      transition={{
        duration: 4.8,
        ease: [0.32, 0.72, 0, 1],
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
          ease: [0.32, 0.72, 0, 1],
          repeat: Infinity
        }}
      >
        <CursorIcon
          side={side}
          className={cn('shrink-0', toneClasses.icon)}
        />
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 font-utekos-text-medium text-xs leading-none',
            toneClasses.label
          )}
        >
          {name}
        </span>
      </motion.div>
    </motion.div>
  )
}
