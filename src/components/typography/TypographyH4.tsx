import { cn } from '@/lib/utils/className'
import type { ReactNode } from 'react'

export function H4({
  Text,
  ID,
  id,
  children,
  className
}: {
  Text?: string
  ID?: string
  id?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <h4
      id={ID ?? id}
      className={cn(
        'scroll-m-20 pb-3 font-sans font-semibold text-xl leading-snug tracking-tight md:text-2xl',
        className ?? ''
      )}
    >
      {children ?? Text}
    </h4>
  )
}
