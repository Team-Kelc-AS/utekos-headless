import { cn } from '@/lib/utils'
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
        'scroll-m-20 font-sans font-utekos-text-medium text-lg tracking-tight md:text-xl',
        className ?? ''
      )}
    >
      {children ?? Text}
    </h4>
  )
}
