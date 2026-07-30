import { cn } from '@/lib/utils'

export function SectionBox({
  bgcolor,
  children,
  className
}: {
  bgcolor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-full overflow-x-clip px-8 py-12 sm:px-10 md:px-12 md:py-16 lg:px-24 lg:py-24 xl:py-28',
        className,
        bgcolor ? bgcolor : 'bg-background dark:bg-dark-background'
      )}
    >
      <div className='text-left'>{children}</div>
    </div>
  )
}
