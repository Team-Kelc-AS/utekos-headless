import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type MdxCalloutProps = {
  children: ReactNode
  className?: string
  title?: string
  tone?: 'default' | 'accent'
}

export function MdxCallout({
  children,
  className,
  title,
  tone = 'default'
}: MdxCalloutProps) {
  return (
    <aside
      aria-label={title}
      className={cn(
        'max-w-[65ch] rounded-2xl p-5 ring-1 sm:p-6',
        tone === 'accent' ?
          'bg-primary/12 ring-primary/35'
        : 'bg-card/45 ring-foreground/10',
        className
      )}
      role='note'
    >
      {title ?
        <p className='mb-2 font-utekos-text-medium text-sm tracking-wide text-foreground'>
          {title}
        </p>
      : null}
      <div className='font-utekos-text text-base leading-relaxed text-foreground/82 [&>p]:max-w-[62ch]'>
        {children}
      </div>
    </aside>
  )
}
