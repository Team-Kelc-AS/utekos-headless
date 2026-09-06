// Path: src/components/header/HeaderSearch/HeaderSearchFooter.tsx
export function HeaderSearchFooter() {
  return (
    <>
      <div className='flex items-center gap-2'>
        <span className='inline-flex items-center gap-1'>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className='lucide lucide-corner-down-left size-3'
          >
            <path d='M20 4v7a4 4 0 0 1-4 4H4' />
            <polyline points='9 10 4 15 9 20' />
          </svg>
          Gå til side
        </span>
      </div>
      <div className='hidden items-center gap-2 md:flex'>
        <span className='flex items-center gap-1'>
          <kbd className='rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground'>
            ↑↓
          </kbd>
          for å velge
        </span>
        <span className='flex items-center gap-1'>
          <kbd className='rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground'>
            esc
          </kbd>
          for å lukke
        </span>
      </div>
    </>
  )
}
