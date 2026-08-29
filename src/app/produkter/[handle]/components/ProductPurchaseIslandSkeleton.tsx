import { Skeleton } from '@/components/ui/skeleton'

export function ProductPurchaseIslandSkeleton() {
  return (
    <div
      aria-hidden='true'
      className='mt-5 min-h-88'
    >
      <Skeleton className='h-6 w-28 md:sr-only' />

      <div className='mt-4 flex flex-col gap-5 md:mt-5 md:gap-8'>
        <div className='space-y-3'>
          <Skeleton className='h-4 w-20' />

          <div className='flex flex-wrap gap-2'>
            <Skeleton className='h-11 w-24 rounded-xl' />
            <Skeleton className='h-11 w-24 rounded-xl' />
            <Skeleton className='h-11 w-24 rounded-xl' />
          </div>
        </div>

        <div className='space-y-3'>
          <Skeleton className='h-4 w-16' />

          <div className='flex flex-wrap gap-2'>
            <Skeleton className='size-11 rounded-full' />
            <Skeleton className='size-11 rounded-full' />
            <Skeleton className='size-11 rounded-full' />
          </div>
        </div>
      </div>

      <div className='mt-5 space-y-3 md:mt-8'>
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-4 w-52' />
      </div>

      <Skeleton className='mt-5 h-12 w-full rounded-xl md:mt-8' />
    </div>
  )
}
