import * as React from 'react'

import { cn } from '@/lib/utils/className'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-md border border-input dark:border-dark-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground dark:placeholder:text-dark-muted-foreground focus-visible:border-ring dark:focus-visible:border-dark-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:focus-visible:ring-dark-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:aria-invalid:border-dark-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-dark-destructive/20 md:text-sm dark:bg-dark-input/30 dark:aria-invalid:border-dark-destructive/50 dark:aria-invalid:ring-dark-destructive/40',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
