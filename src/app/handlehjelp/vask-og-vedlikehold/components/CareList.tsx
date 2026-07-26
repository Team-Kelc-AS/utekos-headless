import { cn } from '@/lib/utils/className'
import type { CareListProps } from '../types'
import { variantStyles } from '../utils/variantStyles'

export function CareList({
  variant,
  title,
  items
}: CareListProps) {
  const { container, iconWrap, Icon } = variantStyles[variant]

  return (
    <div
      className={cn(
        'rounded-lg border p-5 shadow-[0_18px_44px_-36px_color-mix(in_oklab,var(--background)_72%,transparent)] sm:p-6',
        container
      )}
    >
      <div className='flex items-center gap-3'>
        <span
          aria-hidden='true'
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full border',
            iconWrap
          )}
        >
          <Icon className='size-[1.05rem]' strokeWidth={2.4} />
        </span>
        <h4 className='font-utekos-text-medium text-base text-foreground sm:text-lg'>
          {title}
        </h4>
      </div>
      <ul className='/88 mt-4 space-y-2.5 text-sm leading-relaxed text-foreground/88 sm:text-base'>
        {items.map(item => (
          <li key={item} className='flex gap-2.5'>
            <span
              aria-hidden='true'
              className='dark:bg-dark-foreground/44 mt-[0.55em] size-1 shrink-0 rounded-full bg-foreground/44'
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
