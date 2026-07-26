import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

export type SizeGuideSectionSurface =
  | 'card'
  | 'background'
  | 'muted'

type SizeGuideSectionShellProps = {
  id: string
  children: ReactNode
  surface: SizeGuideSectionSurface
  ariaLabelledby?: string
  className?: string
  contentClassName?: string
}

const contentClassNames =
  'w-full px-4 py-14 sm:px-8 sm:py-16 lg:py-20'

const surfaceClassNames: Record<
  SizeGuideSectionSurface,
  string
> = {
  card: 'bg-card text-card-foreground',
  background: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground'
}

export function SizeGuideSectionShell({
  id,
  children,
  surface,
  ariaLabelledby,
  className,
  contentClassName
}: SizeGuideSectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={cn(
        'scroll-mt-28',
        surfaceClassNames[surface],
        className
      )}
    >
      <div
        className={cn(
          'max-w-9xl mx-auto',
          contentClassNames,
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
