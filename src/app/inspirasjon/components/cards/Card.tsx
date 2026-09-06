import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/className'
import Image from 'next/image'
import type { StaticImageData } from 'next/image'

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
        'group/card  flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
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
  as: Tag = 'div',
  className,
  ...props
}: React.ComponentProps<'div'> & { as?: 'div' | 'h3' }) {
  return (
    <Tag
      data-slot='card-title'
      className={cn(
        'font-utekos-text-medium leading-normal tracking-wide text-wrap text-foreground group-data-[size=sm]/card:text-2xl md:text-pretty',
        className
      )}
      {...props}
    />
  )
}

function CardIcon({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-icon'
      className={cn(
        ' flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary',
        className
      )}
      {...props}
    />
  )
}

function CardBadge({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      data-slot='card-badge'
      className={cn('self-start', className)}
      {...props}
    >
      {children}
    </Badge>
  )
}

function CardDescription({
  as: Tag = 'div',
  className,
  ...props
}: React.ComponentProps<'div'> & { as?: 'div' | 'p' }) {
  return (
    <Tag
      data-slot='card-description'
      className={cn(
        'text-description-foreground font-utekos-text text-base tracking-wide text-pretty',
        className
      )}
      {...props}
    />
  )
}

function CardImage({
  className,
  src,
  alt,
  width = 100,
  height = 100,
  ...props
}: Omit<
  React.ComponentProps<typeof Image>,
  'src' | 'alt' | 'width' | 'height'
> & {
  src: string | StaticImageData
  alt: string
  width?: number | `${number}`
  height?: number | `${number}`
}) {
  return (
    <Image
      data-slot='card-image'
      className={cn('rounded-t-xl', className)}
      src={src}
      alt={alt}
      width={width}
      height={height}
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
  CardImage,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardIcon,
  CardBadge
}
