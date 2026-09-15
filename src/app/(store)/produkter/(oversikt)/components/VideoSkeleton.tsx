export function VideoSkeleton() {
  return (
    <div className='bg-neutral-950 py-16 sm:py-24'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-2'>
          <div className='aspect-[9/16] w-full max-w-sm mx-auto animate-pulse rounded-3xl border-4 border-neutral-700 bg-neutral-800 p-2' />

          <div className='space-y-6'>
            <div className='h-10 w-3/4 rounded-lg bg-neutral-800' />
            <div className='space-y-3'>
              <div className='h-4 w-full rounded-lg bg-neutral-800' />
              <div className='h-4 w-full rounded-lg bg-neutral-800' />
              <div className='h-4 w-5/6 rounded-lg bg-neutral-800' />
            </div>
            <div className='h-12 w-48 rounded-lg bg-neutral-800' />
          </div>
        </div>
      </div>
    </div>
  )
}
