// Path: src/app/(store)/kontaktskjema/sections/TopGrid.tsx
export function TopGrid() {
  return (
    <div className='hidden h-24 border-t border-r border-l border-foreground/8 lg:block'>
      <div className='grid h-full grid-cols-12'>
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={`top-${i}`}
            className='h-full border-r border-foreground/8'
          />
        ))}
        <div className='h-full' />
      </div>
    </div>
  )
}
