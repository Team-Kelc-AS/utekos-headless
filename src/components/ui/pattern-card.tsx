import type { ReactNode } from 'react'

export type PatternCardClasses = {
  outer?: string
  inner?: string
  list?: string
  separator?: string
  footerLabel?: string
  iconCircle?: string
  iconRing?: string
  iconPath?: string
}

type PatternCardProps = {
  title: string
  items: string[]
  footerLabel?: string
  footer?: ReactNode
  classes?: PatternCardClasses
}

function cn(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(' ')
}

const defaultPatternCardClasses = {
  outer:
    'bg-foreground/10 dark:bg-dark-foreground/10 dark:bg-white/10',
  inner:
    'bg-background/72 dark:bg-dark-background/72 text-foreground  ring-foreground/12 dark:ring-dark-foreground/12 shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)]',
  list: 'text-foreground/95 /95',
  separator: 'border-(--pattern-fg)',
  footerLabel: 'text-foreground/82 /82',
  iconCircle: 'fill-card/25 dark:fill-dark-card/25',
  iconRing:
    'stroke-foreground/25 dark:stroke-dark-foreground/25',
  iconPath: 'stroke-foreground dark:stroke-dark-foreground'
} satisfies Required<PatternCardClasses>

function PatternCheckIcon({
  classes
}: {
  classes: Required<PatternCardClasses>
}) {
  return (
    <svg
      className='h-lh w-5.5 shrink-0'
      viewBox='0 0 22 22'
      fill='none'
      strokeLinecap='square'
      aria-hidden='true'
    >
      <circle
        cx='11'
        cy='11'
        r='11'
        className={classes.iconCircle}
      />
      <circle
        cx='11'
        cy='11'
        r='10.5'
        className={classes.iconRing}
      />
      <path
        d='M8 11.5L10.5 14L14 8'
        className={classes.iconPath}
      />
    </svg>
  )
}

export function PatternCard({
  title,
  items,
  footerLabel = 'Fortsatt usikker?',
  footer,
  classes
}: PatternCardProps) {
  const cardClasses = {
    ...defaultPatternCardClasses,
    ...classes
  }

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col p-2',
        cardClasses.outer
      )}
    >
      <div
        className={cn(
          'flex h-full flex-col rounded-xl p-8 text-sm/7 ring-1 sm:p-10',
          cardClasses.inner
        )}
      >
        <h3 className='font-utekos-text-medium text-xl leading-7'>
          {title}
        </h3>

        <ul
          role='list'
          className={cn('mt-6 space-y-3', cardClasses.list)}
        >
          {items.map(item => (
            <li key={item} className='flex'>
              <PatternCheckIcon classes={cardClasses} />
              <p className='ml-3'>{item}</p>
            </li>
          ))}
        </ul>

        {footer && (
          <div className='mt-auto'>
            <hr
              className={cn(
                'my-6 w-full',
                cardClasses.separator
              )}
            />
            <p className={cn('mb-3', cardClasses.footerLabel)}>
              {footerLabel}
            </p>
            <p className='font-utekos-text-medium'>{footer}</p>
          </div>
        )}
      </div>
    </div>
  )
}
