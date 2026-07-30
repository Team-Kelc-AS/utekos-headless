import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@/lib/utils/className'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input dark:border-dark-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground dark:file:text-dark-foreground placeholder:text-muted-foreground dark:placeholder:text-dark-muted-foreground focus-visible:border-ring dark:focus-visible:border-dark-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:focus-visible:ring-dark-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:aria-invalid:border-dark-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-dark-destructive/20 md:text-sm dark:bg-dark-input/30 dark:aria-invalid:border-dark-destructive/50 dark:aria-invalid:ring-dark-destructive/40',
        className
      )}
      {...props}
    />
  )
}

export { Input }
