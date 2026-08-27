import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type MdxHeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level: 1 | 2 | 3 | 4
}

const headingClassNames = {
  1: 'text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl',
  2: 'text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl',
  3: 'text-2xl font-medium leading-tight tracking-[-0.025em] sm:text-3xl',
  4: 'text-xl font-medium leading-tight tracking-[-0.015em] sm:text-2xl'
} as const

export function MdxHeading({
  level,
  className,
  ...props
}: MdxHeadingProps) {
  const HeadingTag =
    level === 1 ? 'h1'
    : level === 2 ? 'h2'
    : level === 3 ? 'h3'
    : 'h4'

  return (
    <HeadingTag
      className={cn(
        'group scroll-mt-24 font-sans text-balance text-foreground',
        headingClassNames[level],
        className
      )}
      {...props}
    />
  )
}
