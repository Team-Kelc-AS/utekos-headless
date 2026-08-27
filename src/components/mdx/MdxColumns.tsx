import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type MdxColumnsProps = {
  children: ReactNode
  className?: string
  columns?: 2 | 3
}

export function MdxColumns({
  children,
  className,
  columns = 2
}: MdxColumnsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:gap-8',
        columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
        className
      )}
    >
      {children}
    </div>
  )
}
