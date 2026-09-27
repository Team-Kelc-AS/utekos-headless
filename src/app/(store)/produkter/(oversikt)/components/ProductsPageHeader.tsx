const STAR_POSITIONS = [
  { top: 8, left: 12 },
  { top: 18, left: 78 },
  { top: 26, left: 34 },
  { top: 39, left: 91 },
  { top: 47, left: 56 },
  { top: 58, left: 21 }
] as const

export function ProductsPageHeader() {
  return (
    <header className='relative left-[calc(-50vw+50%)] mb-4 w-screen overflow-hidden bg-night pt-12 pb-16'>
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='motion-grid absolute inset-0' />

        <div className='absolute top-0 left-1/2 h-200 w-250 -translate-x-1/2 opacity-30 mix-blend-screen'>
          <div
            className='motion-spotlight size-full bg-linear-to-b from-sidebar-primary via-primary/20 to-transparent blur-[120px] will-change-transform'
            style={{ transform: 'translate(0, 0)' }}
          />
        </div>

        <div className='absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-foreground/30 to-transparent' />

        {STAR_POSITIONS.map((position, i) => (
          <div
            key={i}
            className='motion-star absolute h-1 w-1 animate-pulse rounded-full bg-foreground opacity-16'
            style={{
              top: `${position.top}%`,
              left: `${position.left}%`,
              boxShadow: '0 0 10px rgba(245,243,239,0.42)'
            }}
          />
        ))}
      </div>

      <div className='relative z-10 container mx-auto px-4 text-center'>
        <h1 className='perspective-1000 mx-auto max-w-5xl font-sans text-3xl font-extrabold text-foreground sm:text-5xl md:text-7xl'>
          <span className='block overflow-hidden'>
            <span className='motion-title-line block font-extrabold text-foreground'>
              JUSTER. FORM.{' '}
              <span className='text-primary'>NYT.</span>
            </span>
          </span>
        </h1>
      </div>

      <div className='pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-linear-to-t from-background via-background/80 to-transparent' />
    </header>
  )
}
