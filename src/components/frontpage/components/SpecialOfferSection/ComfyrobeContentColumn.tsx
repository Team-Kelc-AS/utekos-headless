'use client'

import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils/className'
import type { ReactNode } from 'react'

export function ComfyrobeContentColumn({
  children
}: {
  children: ReactNode
}) {
  const [containerRef, containerInView] = useInView({
    threshold: 0.35
  })

  return (
    <div
      ref={containerRef}
      className={cn(
        'will-animate-fade-in-up min-w-0',
        containerInView && 'is-in-view'
      )}
      style={
        { '--transition-delay': '0.1s' } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
