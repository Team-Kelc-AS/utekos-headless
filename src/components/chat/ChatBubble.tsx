// Path: src/components/chat/ChatBubble.tsx
import { cn } from '@/lib/utils/className'
import type { CSSProperties, ReactNode } from 'react'

export function ChatBubble({
  side,
  children
}: {
  side: 'left' | 'right'
  children: ReactNode
}) {
  const justify =
    side === 'left' ? 'justify-start' : 'justify-end'
  const bubble =
    side === 'left' ? 'rounded-tl-md' : 'rounded-tr-md'
  const bubbleText =
    side === 'left' ?
      'text-card-foreground'
    : 'text-primary-foreground'
  const bubbleStyle =
    side === 'left' ?
      ({
        backgroundColor:
          'color-mix(in oklch, var(--color-card) 82%, var(--color-background))',
        borderColor:
          'color-mix(in oklch, var(--color-foreground) 10%, transparent)'
      } satisfies CSSProperties)
    : undefined

  return (
    <div className={cn('flex', justify)}>
      <div
        className={cn(
          'max-w-xs rounded-2xl border p-3 shadow-lg shadow-background/15 sm:max-w-sm',
          bubble,
          side === 'right' &&
            'border-[color-mix(in_oklch,var(--primary-foreground)_28%,transparent)] bg-primary text-primary-foreground'
        )}
        style={bubbleStyle}
      >
        <div
          className={cn('text-base leading-snug', bubbleText)}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
