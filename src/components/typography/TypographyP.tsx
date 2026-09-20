import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function P({
  Text,
  children,
  className
}: {
  Text?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <p className={cn('leading-normal font-sans text-left mt-0 text-base not-first:mt-6', className ?? '')}  >
      {children ?? Text}
    </p>
  )
}
