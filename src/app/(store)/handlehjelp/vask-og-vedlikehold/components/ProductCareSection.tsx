import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

const toneStyles = {
  base: 'bg-background text-foreground',
  elevated: 'border-t border-border bg-background text-foreground'
} as const

type ProductCareSectionTone = keyof typeof toneStyles

interface ProductCareSectionProps {
  id?: string
  tone?: ProductCareSectionTone
  children: ReactNode
  className?: string
  containerClassName?: string
  'aria-labelledby'?: string
}

const contentClassNames =
  'w-full px-4 py-14 sm:px-8 sm:py-16 lg:py-20'

export function ProductCareSection({
  id,
  tone = 'base',
  children,
  className,
  containerClassName,
  'aria-labelledby': ariaLabelledby
}: ProductCareSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={cn('scroll-mt-28', toneStyles[tone], className)}
    >
      <div
        className={cn(
          'max-w-9xl mx-auto',
          contentClassNames,
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
