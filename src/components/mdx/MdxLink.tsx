import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

export function MdxLink({
  className,
  rel,
  target,
  ...props
}: ComponentPropsWithoutRef<'a'>) {
  const isHeadingAnchor = props['aria-hidden'] === true

  return (
    <a
      className={cn(
        isHeadingAnchor ?
          'ml-2 rounded-sm text-current no-underline opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-45 focus-visible:opacity-100'
        : 'font-utekos-text-medium text-current underline decoration-current/35 underline-offset-[0.22em] transition-[text-decoration-color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:decoration-current focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current',
        className
      )}
      rel={target === '_blank' ? (rel ?? 'noreferrer') : rel}
      target={target}
      {...props}
    />
  )
}
