export function SpecRow({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div className='dark:border-dark-background/12 flex justify-between gap-2 border-b border-background/12 pb-1 last:border-0 md:justify-start'>
      <span className='dark:text-dark-background w-32 shrink-0 font-utekos-text-medium text-background'>
        {label}:
      </span>
      <span className='dark:text-dark-background/82 text-background/82'>
        {value}
      </span>
    </div>
  )
}
