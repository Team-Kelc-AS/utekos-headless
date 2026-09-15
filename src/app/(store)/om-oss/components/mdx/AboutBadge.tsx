import { cn, cva, type VariantProps } from '@/lib/utils/className'
import type { ReactNode } from 'react'

const aboutBadgeVariants = cva(
  'inline-flex min-h-12 items-center justify-center rounded-full px-8 py-4 font-sans font-bold text-base leading-6 text-foreground sm:text-lg',
  {
    variants: {
      tone: {
        primary: 'bg-primary',
        jungle: 'bg-jungle'
      }
    },
    defaultVariants: {
      tone: 'primary'
    }
  }
)

type AboutBadgeProps = {
  children: ReactNode
  className?: string
} & VariantProps<typeof aboutBadgeVariants>

export function AboutBadge({
  children,
  className,
  tone
}: AboutBadgeProps) {
  return (
    <span className={cn(aboutBadgeVariants({ tone }), className)}>
      {children}
    </span>
  )
}
