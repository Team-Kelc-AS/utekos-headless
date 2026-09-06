const cardSurfaceStyle = {
  backgroundColor: 'var(--color-card)'
} as const

export function JusterFormNyt() {
  return (
    <div
      className='relative isolate w-fit shrink-0 self-start rounded-xl border border-foreground/24 px-5 py-3 shadow-md sm:self-center'
      style={cardSurfaceStyle}
    >
      <div className='font-utekos-text-medium flex flex-col gap-0 text-3xl leading-none tracking-tight sm:text-4xl'>
        <span className='text-card-foreground uppercase'>
          Juster.
        </span>
        <span className='text-card-foreground uppercase'>
          Form.
        </span>
        <span className='text-card-foreground uppercase'>
          Nyt.
        </span>
      </div>
    </div>
  )
}
