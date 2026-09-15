// Path: src/app/(store)/kontaktskjema/sections/CornerPluses.tsx
export function CornerPluses() {
  return (
    <>
      {/* Top-left plus */}
      <div
        className='pointer-events-none absolute top-0 left-0 z-10'
        style={{ transform: 'translate(-50%, -50%)' }}
        aria-hidden='true'
      >
        <svg
          width='32'
          height='32'
          viewBox='0 0 32 32'
          fill='none'
        >
          <line
            x1='16'
            y1='0'
            x2='16'
            y2='32'
            stroke='var(--foreground)'
            strokeOpacity='0.22'
            strokeWidth='1'
          />
          <line
            x1='0'
            y1='16'
            x2='32'
            y2='16'
            stroke='var(--foreground)'
            strokeOpacity='0.22'
            strokeWidth='1'
          />
        </svg>
      </div>

      {/* Bottom-right plus */}
      <div
        className='pointer-events-none absolute right-0 bottom-0 z-10'
        style={{ transform: 'translate(50%, 50%)' }}
        aria-hidden='true'
      >
        <svg
          width='32'
          height='32'
          viewBox='0 0 32 32'
          fill='none'
        >
          <line
            x1='16'
            y1='0'
            x2='16'
            y2='32'
            stroke='var(--foreground)'
            strokeOpacity='0.22'
            strokeWidth='1'
          />
          <line
            x1='0'
            y1='16'
            x2='32'
            y2='16'
            stroke='var(--foreground)'
            strokeOpacity='0.22'
            strokeWidth='1'
          />
        </svg>
      </div>
    </>
  )
}
