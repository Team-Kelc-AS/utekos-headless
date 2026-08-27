import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

export function MdxBlockquote({
  className,
  ...props
}: ComponentPropsWithoutRef<'blockquote'>) {
  return (
    <blockquote
      className={cn(
        'max-w-[58ch] border-l-2 border-primary pl-5 font-utekos-text-medium text-xl leading-relaxed text-foreground sm:pl-7 sm:text-2xl',
        className
      )}
      {...props}
    />
  )
}
