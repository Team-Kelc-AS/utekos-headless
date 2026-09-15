import type { CSSProperties, ReactNode } from 'react'
import { PatternFrame } from '@/components/ui/pattern-frame'
import { cn } from '@/lib/utils/className'

type ProductCareCardRailLayout = 'centered' | 'flush'

interface ProductCareCardRailProps {
  ariaLabel: string
  children: ReactNode
  className?: string
  layout?: ProductCareCardRailLayout
}

const patternStyle = {
  '--pattern-fg':
    'color-mix(in oklab, var(--foreground) 18%, transparent)'
} as CSSProperties

export function ProductCareCardRail({
  ariaLabel,
  children,
  className,
  layout = 'centered'
}: ProductCareCardRailProps) {
  const isFlush = layout === 'flush'

  return (
    <PatternFrame
      as='div'
      variant='content'
      surface='transparent'
      align={isFlush ? 'start' : 'center'}
      showHorizontalRules={!isFlush}
      gutterWidth='clamp(0.75rem,2vw,1.5rem)'
      {...(isFlush ?
        {}
      : { contentWidth: 'min(72rem,calc(100% - 3rem))' })}
      className={cn('w-full', className)}
      contentClassName='w-full'
      style={patternStyle}
    >
      <ol
        aria-label={ariaLabel}
        className='grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'
      >
        {children}
      </ol>
    </PatternFrame>
  )
}
