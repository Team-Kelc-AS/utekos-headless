import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

export function MdxTable({
  className,
  ...props
}: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className='max-w-full overflow-x-auto rounded-2xl bg-card/45 p-1 ring-1 ring-foreground/8'>
      <table
        className={cn(
          'w-full min-w-xl border-collapse text-left font-utekos-text text-sm text-foreground/82 sm:text-base',
          className
        )}
        {...props}
      />
    </div>
  )
}
