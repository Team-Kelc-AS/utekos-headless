import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'
import type { InspirationHeroAlign } from './types'

interface InspirationHeroSectionProps {
  children: ReactNode
  labelledBy: string
  as?: 'section' | 'article'
  align?: InspirationHeroAlign
  minHeight?: 'standard' | 'tall' | 'content'
  surfaceClassName?: string
  background?: ReactNode
  className?: string
  containerClassName?: string
  maxWidthClassName?: string
}

export function InspirationHeroSection({
  children,
  labelledBy,
  as: Tag = 'section',
  align = 'left',
  minHeight = 'content',
  surfaceClassName,
  background,
  className,
  containerClassName,
  maxWidthClassName = 'max-w-5xl'
}: InspirationHeroSectionProps) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cn(
        'relative isolate flex overflow-hidden',
        minHeight === 'tall' ? 'min-h-[110svh]' : 'min-h-0',
        align === 'center' ? 'flex-col justify-center' : 'items-start',
        surfaceClassName,
        className
      )}
    >
      {background}

      <div
        className={cn(
          'container relative z-10 mx-auto px-5 pt-16 pb-16 md:px-4 sm:pt-20 sm:pb-14',
          containerClassName
        )}
      >
        <div
          className={cn(maxWidthClassName, align === 'center' && 'mx-auto text-center')}
        >
          {children}
        </div>
      </div>
    </Tag>
  )
}
