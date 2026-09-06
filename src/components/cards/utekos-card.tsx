import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader
} from '@/components/ui/card'
import { cn } from '@/lib/utils/className'

const utekosCardVariants = cva(
  [
    'relative isolate h-full overflow-hidden rounded-lg border transition-[transform,box-shadow,border-color] duration-300',
    'before:pointer-events-none before:absolute before:inset-0 before:z-[-1]',
    'before:bg-[linear-gradient(135deg,color-mix(in_oklch,currentColor_10%,transparent),transparent_58%)]'
  ].join(' '),
  {
    variants: {
      palette: {
        maritime:
          'border-foreground/10 bg-[linear-gradient(145deg,var(--color-havdyp),var(--color-maritime-darkest))] text-foreground ring-foreground/10',
        plum: 'border-foreground/10 bg-[linear-gradient(145deg,var(--color-plum),var(--color-header-secondary))] text-foreground ring-foreground/10',
        forest:
          'border-foreground/10 bg-[linear-gradient(145deg,var(--color-mountain-view),var(--color-deep-forest))] text-foreground ring-foreground/10',
        ember:
          'border-foreground/10 bg-[linear-gradient(145deg,var(--color-ganache),var(--color-chocolate-truffle))] text-foreground ring-foreground/10',
        sand: 'border-card-foreground/10 bg-[linear-gradient(145deg,var(--color-foreground),var(--color-white-down))] text-card-foreground ring-card-foreground/10',
        rose: 'border-card-foreground/10 bg-[linear-gradient(145deg,var(--color-fairy-tale),var(--color-bleached-mauve-light))] text-card-foreground ring-card-foreground/10',
        tide: 'border-card-foreground/10 bg-[linear-gradient(145deg,var(--color-quiet-tide),var(--color-ancient-water))] text-card-foreground ring-card-foreground/10',
        peri: 'border-foreground/10 bg-[linear-gradient(145deg,var(--color-eggplant),var(--color-amethyst-purple))] text-foreground ring-foreground/10'
      },
      density: {
        compact: '[--card-spacing:--spacing(4)]',
        default: '[--card-spacing:--spacing(6)]',
        relaxed: '[--card-spacing:--spacing(8)]'
      },
      surface: {
        flat: 'shadow-none',
        raised: 'shadow-[0_30px_80px_-48px_rgba(0,0,0,0.85)]',
        stitched: 'rounded-none shadow-none'
      },
      interactive: {
        true: 'motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_36px_90px_-52px_rgba(0,0,0,0.95)]',
        false: ''
      }
    },
    defaultVariants: {
      palette: 'maritime',
      density: 'default',
      surface: 'raised',
      interactive: false
    }
  }
)

const utekosCardGridVariants = cva('w-full', {
  variants: {
    layout: {
      responsive:
        'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3',
      mosaic:
        'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12 [&>*]:lg:col-span-4 [&>[data-featured=true]]:lg:col-span-6 [&>[data-wide=true]]:lg:col-span-6',
      cluster:
        'grid grid-cols-1 gap-0 overflow-hidden rounded-lg md:grid-cols-3 [&>*]:rounded-none [&>*]:shadow-none max-md:[&>*:not(:last-child)]:border-b-0 md:[&>*:not(:last-child)]:border-r-0',
      rail: 'utekos-card-rail [container-type:scroll-state] relative flex snap-x snap-mandatory [scrollbar-width:thin] gap-4 overflow-x-auto overscroll-x-contain pb-4 [&>*]:min-w-[18rem] [&>*]:snap-start sm:[&>*]:min-w-[22rem]'
    },
    bleed: { none: '', section: '-mx-4 px-4 md:-mx-8 md:px-8' }
  },
  defaultVariants: { layout: 'responsive', bleed: 'none' }
})

type UtekosCardPalette = NonNullable<
  VariantProps<typeof utekosCardVariants>['palette']
>

type UtekosCardProps = ComponentProps<typeof Card> &
  VariantProps<typeof utekosCardVariants>

function UtekosCard({
  className,
  palette = 'maritime',
  density = 'default',
  surface = 'raised',
  interactive = false,
  size,
  ...props
}: UtekosCardProps) {
  const resolvedSize =
    size ?? (density === 'compact' ? 'sm' : 'default')

  return (
    <Card
      size={resolvedSize}
      className={cn(
        utekosCardVariants({
          palette,
          density,
          surface,
          interactive
        }),
        className
      )}
      {...props}
    />
  )
}

type UtekosCardGridProps = ComponentProps<'div'> &
  VariantProps<typeof utekosCardGridVariants>

function UtekosCardGrid({
  className,
  layout = 'responsive',
  bleed = 'none',
  children,
  ...props
}: UtekosCardGridProps) {
  const gridClassName = cn(
    utekosCardGridVariants({ layout, bleed }),
    className
  )

  if (layout === 'rail') {
    return (
      <div className={gridClassName} tabIndex={0} {...props}>
        <span
          aria-hidden='true'
          className='utekos-card-rail-hint utekos-card-rail-hint--start'
        />
        {children}
        <span
          aria-hidden='true'
          className='utekos-card-rail-hint utekos-card-rail-hint--end'
        />
      </div>
    )
  }

  return (
    <div className={gridClassName} {...props}>
      {children}
    </div>
  )
}

type UtekosCardMediaProps = ComponentProps<'div'> & {
  bleed?: 'top' | 'full' | 'none'
}

function UtekosCardMedia({
  className,
  bleed = 'top',
  ...props
}: UtekosCardMediaProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        bleed === 'top' &&
          '-mx-(--card-spacing) -mt-(--card-spacing) mb-2',
        bleed === 'full' && '-m-(--card-spacing)',
        className
      )}
      {...props}
    />
  )
}

type UtekosCardIconProps = ComponentProps<'div'> & {
  icon: LucideIcon
}

function UtekosCardIcon({
  icon: Icon,
  className,
  ...props
}: UtekosCardIconProps) {
  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-lg border border-current/15',
        'bg-[color-mix(in_oklch,currentColor_10%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklch,currentColor_18%,transparent)]',
        className
      )}
      {...props}
    >
      <Icon aria-hidden='true' className='size-5' />
    </div>
  )
}

function UtekosCardHeader({
  className,
  ...props
}: ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn('bg-transparent', className)}
      {...props}
    />
  )
}

function UtekosCardAction({
  className,
  ...props
}: ComponentProps<typeof CardAction>) {
  return (
    <CardAction
      className={cn('text-current', className)}
      {...props}
    />
  )
}

function UtekosCardEyebrow({
  className,
  variant = 'outline',
  ...props
}: ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant={variant}
      className={cn(
        'border-current/15 bg-[color-mix(in_oklch,currentColor_10%,transparent)] text-current',
        className
      )}
      {...props}
    />
  )
}

function UtekosCardTitle({
  className,
  ...props
}: ComponentProps<'h3'>) {
  return (
    <h3
      data-slot='utekos-card-title'
      className={cn(
        'bg-transparent font-sans font-utekos-text-medium text-xl leading-[1.05] tracking-normal text-balance text-current md:text-2xl',
        className
      )}
      {...props}
    />
  )
}

function UtekosCardDescription({
  className,
  ...props
}: ComponentProps<typeof CardDescription>) {
  return (
    <CardDescription
      className={cn(
        'card-text max-w-prose text-current opacity-80',
        className
      )}
      {...props}
    />
  )
}

function UtekosCardContent({
  className,
  ...props
}: ComponentProps<typeof CardContent>) {
  return (
    <CardContent
      className={cn('text-current', className)}
      {...props}
    />
  )
}

function UtekosCardActions({
  className,
  ...props
}: ComponentProps<typeof CardFooter>) {
  return (
    <CardFooter
      className={cn(
        'mt-auto flex flex-wrap gap-3 rounded-b-lg text-current max-sm:flex-col max-sm:items-stretch',
        className
      )}
      {...props}
    />
  )
}

type UtekosCardActionButtonProps = ComponentProps<
  typeof Button
> & { emphasis?: 'primary' | 'secondary' }

function UtekosCardActionButton({
  className,
  emphasis = 'primary',
  variant = emphasis === 'primary' ? 'outline' : 'ghost',
  ...props
}: UtekosCardActionButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(
        'border-current/20 bg-transparent text-current hover:bg-[color-mix(in_oklch,currentColor_10%,transparent)] hover:text-current',
        emphasis === 'secondary' && 'border-transparent',
        className
      )}
      {...props}
    />
  )
}

type UtekosCardStatProps = ComponentProps<'div'> & {
  value: string
  label: string
  detail?: ReactNode
}

function UtekosCardStat({
  value,
  label,
  detail,
  className,
  ...props
}: UtekosCardStatProps) {
  return (
    <div
      className={cn('flex flex-col gap-1', className)}
      {...props}
    >
      <span className='font-google-sans font-sans text-3xl leading-none font-bold tracking-normal'>
        {value}
      </span>
      <span className='text-sm leading-snug text-current opacity-75'>
        {label}
      </span>
      {detail ?
        <span className='text-sm leading-snug text-current opacity-65'>
          {detail}
        </span>
      : null}
    </div>
  )
}

export {
  UtekosCard,
  UtekosCardActions,
  UtekosCardAction,
  UtekosCardActionButton,
  UtekosCardContent,
  UtekosCardDescription,
  UtekosCardEyebrow,
  UtekosCardGrid,
  UtekosCardHeader,
  UtekosCardIcon,
  UtekosCardMedia,
  UtekosCardStat,
  UtekosCardTitle,
  type UtekosCardPalette
}
