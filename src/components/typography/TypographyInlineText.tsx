import { cn } from '@/lib/utils'
import type { ElementType, ReactNode } from 'react'

type InlineTextElement = 'span' | 'small' | 'strong' | 'div'

interface InlineTextProps {
  as?: InlineTextElement
  children: ReactNode
  className?: string
}

export function InlineText({
  as = 'span',
  children,
  className
}: InlineTextProps) {
  const Component = as as ElementType

  return (
    <Component
      className={cn(
        'font-sans tracking-normal',
        className
      )}
    >
      {children}
    </Component>
  )
}
