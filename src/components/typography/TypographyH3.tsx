import { cn } from '@/lib/utils/className'
import type { ReactNode } from 'react'

export function H3({
  Text,
  ID,
  children,
  className
}: {
  Text?: string
  ID?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <h3
      id={ID}
      className={cn(
        'scroll-m-20 pb-4 font-sans font-utekos-text-medium text-2xl leading-tight tracking-tight md:text-3xl',
        className ?? ''
      )}
    >
      {children ?? Text}
    </h3>
  )
}
