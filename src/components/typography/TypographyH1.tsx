import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function TypographyH1({
  Text,
  ID,
  children,
  className
}: {
  Text?: string
  ID: string
  children?: ReactNode
  className?: string
}) {
  return (
    <h1
      id={ID}
      className={cn(
        'huge:text-[120px] font-google-sans relative mx-auto mb-2 w-full scroll-m-20 overflow-hidden px-2 text-center font-sans text-4xl font-bold tracking-normal text-foreground md:text-5xl lg:text-7xl xl:text-[100px]',
        className ?? ''
      )}
      aria-label={Text}
    >
      {children ?? Text}
    </h1>
  )
}

export function H1({
  Text,
  ID,
  children,
  className
}: {
  Text?: string
  ID: string
  children?: ReactNode
  className?: string
}) {
  return (
    <h1
      id={ID}
      className={cn(
        'scroll-m-20 text-left font-sans text-5xl font-extrabold tracking-tight text-balance md:text-6xl lg:text-7xl xl:text-8xl',
        className ?? ''
      )}
    >
      {children ?? Text}
    </h1>
  )
}
