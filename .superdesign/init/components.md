# Shared UI primitives

## `src/components/ui/button.tsx`

```tsx
import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/className'

const buttonVariants = cva(
  'group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        'alternate':
          'bg-alternate-button text-foreground hover:scale-104 hover:bg-[#12403C]',
        'checkout':
          'bg-primary text-foreground hover:text-foreground/90 rounded-2xl hover:opacity-60 hover:scale-103',
        'commerce-primary':
          'bg-primary text-foreground hover:opacity-60 rounded-2xl',
        'commerce-secondary':
          'border-commerce-secondary bg-commerce-secondary text-commerce-secondary-foreground hover:bg-commerce-secondary-hover hover:text-commerce-secondary-hover-foreground',
        'default':
          'hover:bg-primary-hover bg-primary text-primary-foreground',
        'outline':
          'border-input bg-background hover:bg-accent hover:text-accent-foreground',
        'seeProduct':
          'border-border bg-sidebar-primary text-foreground shadow-xs aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        'secondary':
          'bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        'ghost':
          'text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        'destructive':
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:border-destructive focus-visible:ring-destructive/30',
        'link':
          'text-primary underline-offset-4 hover:underline',
        'utekos':
          'bg-primary text-foreground hover:opacity-60 rounded-2xl'
      },
      size: {
        'default':
          'h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        'xs': 'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*="size-"])]:size-3',
        'sm': 'h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        'lg': 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        'icon': 'size-9',
        'icon-xs':
          'size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*="size-"])]:size-3',
        'icon-sm':
          'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-10'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

function Button({
  asChild = false,
  className,
  children,
  nativeButton,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const buttonClassName = cn(
    buttonVariants({ variant, size, className })
  )

  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(
      children
    ) as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      ...(props as Record<string, unknown>),
      'data-slot': 'button',
      'className': cn(buttonClassName, child.props.className)
    } as React.Attributes & {
      'className'?: string
      'data-slot': string
    })
  }

  return (
    <ButtonPrimitive
      data-slot='button'
      className={buttonClassName}
      nativeButton={nativeButton}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

function AddToCartButton() {
  return (
    <button
      className={cn(
        'font-google-sans transform rounded-full px-12 py-4 font-utekos-text font-bold tracking-normal transition-colors duration-200 hover:scale-105'
      )}
    >
      Legg i handlekurv
    </button>
  )
}

function CheckoutButton() {
  return (
    <button
      className={cn(
        'transform rounded-full px-12 py-4 font-sans tracking-normal transition-colors duration-200 hover:scale-105'
      )}
    >
      Gå til kassen
    </button>
  )
}

function UtekosButton() {
  return (
    <Button variant='utekos' size='default'>
      Utekos
    </Button>
  )
}

export {
  Button,
  buttonVariants,
  AddToCartButton,
  CheckoutButton,
  UtekosButton
}

```

## `src/components/ui/card.tsx`

```tsx
import * as React from 'react'

import { cn } from '@/lib/utils/className'

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot='card'
      data-size={size}
      className={cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)',
        className
      )}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-title'
      className={cn(
        'font-utekos-text-medium leading-normal tracking-normal text-wrap text-foreground group-data-[size=sm]/card:text-sm md:text-pretty',
        className
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-description'
      className={cn(
        'text-description-foreground text-base tracking-wide',
        className
      )}
      {...props}
    />
  )
}

function CardAction({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-content'
      className={cn('px-4 text-foreground', className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn(
        'flex items-center rounded-b-xl px-4 [.border-t]:pt-(--card-spacing)',
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent
}

```

## `src/components/ui/table.tsx`

```tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils/className'

function Table({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot='table-container'
      className='relative w-full overflow-x-auto'
    >
      <table
        data-slot='table'
        className={cn(
          'w-full caption-bottom text-sm',
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  ...props
}: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

function TableBody({
  className,
  ...props
}: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  ...props
}: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  ...props
}: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

function TableHead({
  className,
  ...props
}: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  ...props
}: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot='table-caption'
      className={cn(
        'mt-4 text-sm text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
}

```

## `src/components/ui/badge.tsx`

```tsx
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/className'

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        popover:
          'bg-popover text-foreground hover:scale-102 hover:bg-popover/80',
        default:
          'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        promo: 'bg-badge py-6 px-6 font-utekos-text-medium tracking-normal text-foreground rounded-xl',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20',
        outline:
          'border-border bg-background text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'hover:bg-muted hover:text-muted-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: 'badge', variant }
  })
}

export { Badge, badgeVariants }

```

## `src/components/ui/breadcrumb.tsx`

```tsx
import type { HTMLAttributes } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@/lib/utils/className'
import {
  ChevronRightIcon,
  MoreHorizontalIcon
} from 'lucide-react'

function Breadcrumb({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <nav
      aria-label='breadcrumb'
      data-slot='breadcrumb'
      className={cn(className)}
      {...props}
    />
  )
}

function BreadcrumbList({
  className,
  ...props
}: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      data-slot='breadcrumb-list'
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground sm:gap-2.5',
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      data-slot='breadcrumb-item'
      className={cn(
        'inline-flex items-center gap-1.5',
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<'a'>) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      {
        className: cn(
          'text-muted-foreground transition-colors hover:text-foreground',
          className
        )
      },
      props
    ),
    render,
    state: { slot: 'breadcrumb-link' }
  })
}

function BreadcrumbPage({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot='breadcrumb-page'
      role='link'
      aria-disabled='true'
      aria-current='page'
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLLIElement> & {
  children?: React.ReactNode
}) {
  return (
    <li
      data-slot='breadcrumb-separator'
      role='presentation'
      aria-hidden='true'
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot='breadcrumb-ellipsis'
      role='presentation'
      aria-hidden='true'
      className={cn(
        'flex size-5 items-center justify-center [&>svg]:size-4',
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className='sr-only'>More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
}

```

## `src/components/BrandComponents/utils/BrandBadge.tsx`

```tsx
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils/className'
import {
  Children,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  cloneElement
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from '@/lib/utils/className'

const brandBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-8 py-4 text-lg leading-[1.35] tracking-[-0.01em] whitespace-nowrap drop-shadow-lg/50',
  {
    variants: {
      variant: { default: '' },
      tone: {
        'neutral':
          ' bg-card text-card-foreground',
        'promo':
          'bg-promo text-promo-foreground',
        'commerce-primary':
          'bg-commerce-primary text-commerce-primary-foreground hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground',
        'commerce-secondary':
          'bg-commerce-secondary text-commerce-secondary-foreground hover:bg-commerce-secondary-hover hover:text-commerce-secondary-hover-foreground',
        'featured':
          'bg-featured text-foreground',
        'custom':
          'bg-(--brand-badge-bg) text-(--brand-badge-text)'
      }
    },
    defaultVariants: { variant: 'default', tone: 'neutral' }
  }
)

interface BrandBadgeProps
  extends
    HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof brandBadgeVariants> {
  label?: string
  asChild?: boolean
  icon?: LucideIcon
  iconColor?: string
  children?: ReactNode
  bgColor?: string
  fgColor?: string
  /** Alias for `bgColor`; used by existing call sites. */
  backgroundColor?: string
  /** Alias for `fgColor`; used by existing call sites. */
  textColor?: string
  /**
   * @deprecated Use `tone` so surface and foreground remain auditable.
   */
  iconBorderColor?: string
}

export default function BrandBadge({
  label,
  icon: Icon,
  iconColor,
  asChild = false,
  variant = 'default',
  tone = 'neutral',
  className = '',
  bgColor,
  fgColor,
  backgroundColor,
  textColor,
  children,
  style,
  ...rest
}: BrandBadgeProps) {
  const resolvedBg = bgColor ?? backgroundColor
  const resolvedFg = fgColor ?? textColor
  const effectiveTone =
    resolvedBg || resolvedFg ? 'custom' : tone
  const mergedStyle = {
    ...style,
    '--brand-badge-bg': resolvedBg ?? 'var(--card)',
    '--brand-badge-text': resolvedFg ?? 'var(--card-foreground)'
  } as CSSProperties

  const iconClassName = cn(
    'size-4 shrink-0 sm:size-5 lg:size-6',
    iconColor ? `fill-${iconColor}` : 'currentColor'
  )
  const iconStyle = iconColor ? { color: iconColor } : undefined

  if (asChild) {
    const [resolvedChild] = Children.toArray(children).filter(
      child =>
        child !== null &&
        (typeof child !== 'string' || child.trim() !== '')
    )
    if (!resolvedChild) {
      return null
    }

    if (!isValidElement(resolvedChild)) {
      return null
    }

    const slotChild =
      Icon ?
        cloneElement(
          resolvedChild as React.ReactElement<
            { children?: ReactNode } & Record<string, unknown>
          >,
          {
            children: (
              <>
                <Icon
                  className={iconClassName}
                  style={iconStyle}
                  aria-hidden='true'
                />
                {
                  (
                    resolvedChild as React.ReactElement<
                      { children?: ReactNode } & Record<
                        string,
                        unknown
                      >
                    >
                  ).props.children
                }
              </>
            )
          }
        )
      : resolvedChild

    return (
      <Slot
        className={cn(
          brandBadgeVariants({ variant, tone: effectiveTone }),
          className
        )}
        style={mergedStyle}
        {...rest}
      >
        {slotChild}
      </Slot>
    )
  }

  return (
    <span
      className={cn(
        brandBadgeVariants({ variant, tone: effectiveTone }),
        className
      )}
      style={mergedStyle}
      {...rest}
    >
      {Icon ?
        <Icon
          className={iconClassName}
          style={iconStyle}
          aria-hidden='true'
        />
      : null}
      {children ?? label}
    </span>
  )
}

```

## `src/lib/utils/className.ts`

```tsx
/**
 * @file src/lib/utils/className.ts
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { cva, type VariantProps } from 'class-variance-authority'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { cva, type VariantProps }

```
