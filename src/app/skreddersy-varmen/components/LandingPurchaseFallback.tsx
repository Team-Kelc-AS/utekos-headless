export function LandingPurchaseFallback() {
  return (
    <section
      aria-busy='true'
      aria-label='Laster produktvalg'
      role='status'
      className='bg-foreground-muted min-h-[40rem] w-full px-6 py-16 text-background'
    >
      <span className='sr-only'>Laster produktvalg</span>
      <div
        aria-hidden='true'
        className='mx-auto grid max-w-7xl gap-10 min-[900px]:grid-cols-2'
      >
        <div className='aspect-4/5 animate-pulse rounded-2xl bg-background/10 motion-reduce:animate-none' />
        <div className='space-y-6 py-8'>
          <div className='h-5 w-28 animate-pulse rounded bg-background/10 motion-reduce:animate-none' />
          <div className='h-11 w-2/3 animate-pulse rounded bg-background/10 motion-reduce:animate-none' />
          <div className='h-7 w-1/3 animate-pulse rounded bg-background/10 motion-reduce:animate-none' />
          <div className='grid grid-cols-3 gap-3'>
            <div className='h-12 animate-pulse rounded-xl bg-background/10 motion-reduce:animate-none' />
            <div className='h-12 animate-pulse rounded-xl bg-background/10 motion-reduce:animate-none' />
            <div className='h-12 animate-pulse rounded-xl bg-background/10 motion-reduce:animate-none' />
          </div>
          <div className='h-14 w-full animate-pulse rounded-xl bg-background/10 motion-reduce:animate-none' />
        </div>
      </div>
    </section>
  )
}
