import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

interface HeroHighlightProps {
  children: ReactNode
  color?: string
  gradient?: string
  display?: 'inline' | 'block'
  className?: string
}

export function HeroHighlight({
  children,
  color,
  gradient,
  display = 'inline',
  className
}: HeroHighlightProps) {
  const style: CSSProperties =
    gradient ? { backgroundImage: gradient }
    : color ? { color }
    : {}

  return (
    <span
      className={cn(
        display === 'block' ? 'block md:inline' : 'inline',
        gradient && 'bg-clip-text text-transparent',
        className
      )}
      style={style}
    >
      {children}
    </span>
  )
}
