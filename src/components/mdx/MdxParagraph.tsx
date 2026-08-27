import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

export function MdxParagraph({
  className,
  ...props
}: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className={cn(
        'max-w-[65ch] font-utekos-text text-base leading-relaxed text-foreground/82 sm:text-lg',
        className
      )}
      {...props}
    />
  )
}
