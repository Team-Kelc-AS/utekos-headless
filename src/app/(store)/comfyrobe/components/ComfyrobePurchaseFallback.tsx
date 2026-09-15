export function ComfyrobePurchaseFallback() {
  return (
    <section
      aria-busy='true'
      aria-label='Laster produktvalg'
      className='min-h-[780px] w-full bg-foreground px-6 py-20 text-background'
    >
      <div className='mx-auto grid max-w-7xl gap-10 lg:grid-cols-2'>
        <div className='aspect-4/5 animate-pulse rounded-3xl bg-background/10 motion-reduce:animate-none' />
        <div className='space-y-6 py-8'>
          <div className='h-10 w-2/3 animate-pulse rounded bg-background/10 motion-reduce:animate-none' />
          <div className='h-16 w-1/2 animate-pulse rounded bg-background/10 motion-reduce:animate-none' />
          <div className='h-40 animate-pulse rounded-3xl bg-background/10 motion-reduce:animate-none' />
        </div>
      </div>
    </section>
  )
}
