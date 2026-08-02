import { Skeleton } from '@/components/ui/skeleton'

export function NbccProductSectionSkeleton() {
  return (
    <article className='dark:bg-dark-background bg-background px-6 py-20 sm:px-8 sm:py-24 lg:px-10'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
          <div className='flex flex-col gap-3'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-10 w-96 max-w-full' />
          </div>
        </div>
        <div className='mt-12 grid gap-5 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1a1713] p-5'
            >
              <Skeleton className='h-64 w-full rounded-lg' />
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
              <Skeleton className='h-10 w-full' />
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
