// Path: src/components/kontakt/BottomGrid.tsx
export function BottomGrid() {
  return (
    <div className='h-24 border-r border-b border-l border-foreground/8'>
      <div className='grid h-full grid-cols-8 md:hidden'>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={`bottom-mobile-${i}`}
            className='h-full border-r border-foreground/8'
          />
        ))}
        <div className='h-full' />
      </div>

      <div className='hidden h-full grid-cols-10 md:grid lg:hidden'>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={`bottom-tablet-${i}`}
            className='h-full border-r border-foreground/8'
          />
        ))}
        <div className='h-full' />
      </div>

      <div className='hidden h-full grid-cols-12 lg:grid'>
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={`bottom-desktop-${i}`}
            className='h-full border-r border-foreground/8'
          />
        ))}
        <div className='h-full' />
      </div>
    </div>
  )
}
