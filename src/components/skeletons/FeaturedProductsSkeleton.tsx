import { frontpageSectionStackClassName } from '@/components/frontpage/layout/frontpageSectionStack'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/className'

export function FeaturedProductsSkeleton() {
  return (
    <div
      className={cn(
        frontpageSectionStackClassName,
        'w-full bg-primary text-foreground'
      )}
    >
      <div className='relative mx-auto w-full border-t border-t-foreground/30 px-[var(--product-rail)] pt-10 pb-16 [--product-rail:1rem] sm:pt-14 sm:pb-20 sm:[--product-rail:1.5rem] md:pt-16 md:pb-24 md:[--product-rail:clamp(3rem,7.42vw,4.75rem)] lg:pt-24 lg:pb-32 xl:[--product-rail:6rem]'>
        <Skeleton className='mx-auto mb-12 h-10 w-64' />
        <div className='-mr-[var(--product-rail)] xl:mr-0'>
          <Skeleton className='h-[400px] w-full' />
        </div>
      </div>
    </div>
  )
}
