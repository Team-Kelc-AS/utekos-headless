import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Route } from 'next'
import type { ReactNode } from 'react'

type MdxActionProps = {
  children: ReactNode
  className?: string
  href: string
  variant?: 'solid' | 'outline'
}

export function MdxAction({
  children,
  className,
  href,
  variant = 'solid'
}: MdxActionProps) {
  return (
    <Link
      href={href as Route}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-utekos-text-medium text-sm leading-none whitespace-nowrap transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 active:translate-y-px',
        variant === 'solid' ?
          'bg-primary text-primary-foreground hover:brightness-110 focus-visible:outline-primary'
        : 'bg-transparent text-foreground ring-1 ring-foreground/28 hover:bg-foreground/8 focus-visible:outline-foreground',
        className
      )}
    >
      {children}
    </Link>
  )
}
