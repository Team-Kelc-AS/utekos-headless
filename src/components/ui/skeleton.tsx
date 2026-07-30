import { cn } from '@/lib/utils/className'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted dark:bg-dark-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
