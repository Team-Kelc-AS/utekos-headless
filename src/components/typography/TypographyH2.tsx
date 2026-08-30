import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function H2({
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
    <h2
      id={ID ?? id}
      className={cn(
        'scroll-m-20 pb-4 font-sans font-utekos-text-medium text-4xl tracking-tight first:mt-0 md:text-5xl lg:text-6xl',
        className ?? ''
      )}
    >
      {children ?? Text}
    </h2>
  )
}
