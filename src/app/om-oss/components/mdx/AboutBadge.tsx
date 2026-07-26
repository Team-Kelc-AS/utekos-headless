import { cn } from '@/lib/utils/className'
import type { ReactNode } from 'react'

type AboutBadgeProps = {
  children: ReactNode
  className?: string
}

export function AboutBadge({
  children,
  className
}: AboutBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-8 py-4 font-utekos-text-medium text-base leading-6 text-secondary-foreground sm:text-lg',
        className
      )}
    >
      {children}
    </span>
  )
}
