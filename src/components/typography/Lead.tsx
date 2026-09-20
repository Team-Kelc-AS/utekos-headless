import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Lead({
  Text,
  children,
  className
}: {
  Text?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'font-sans font-semibold pb-4 text-lg tracking-normal md:pb-6 md:text-2xl lg:pb-8 lg:text-3xl',
        className ?? ''
      )}
    >
      {children ?? Text}
    </p>
  )
}
