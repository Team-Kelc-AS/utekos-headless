'use client'

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'

import { cn } from '@/lib/utils/className'

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot='separator'
      orientation={orientation}
      className={cn(
        'shrink-0 bg-foreground/30',
        orientation === 'horizontal' ? 'h-px w-full' : (
          'w-px self-stretch'
        ),
        className
      )}
      {...props}
    />
  )
}

export { Separator }
