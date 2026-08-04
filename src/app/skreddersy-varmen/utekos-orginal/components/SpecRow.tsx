export function SpecRow({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div className='flex justify-between gap-2 border-b border-foreground/12 pb-1 last:border-0 md:justify-start'>
      <span className='w-32 shrink-0 font-utekos-text-medium text-foreground'>
        {label}:
      </span>
      <span className='text-foreground'>{value}</span>
    </div>
  )
}
