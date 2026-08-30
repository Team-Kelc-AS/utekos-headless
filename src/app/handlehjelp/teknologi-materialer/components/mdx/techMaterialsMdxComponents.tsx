import type { ComponentProps } from 'react'
import type { MDXComponents } from 'mdx/types'
import { cn } from '@/lib/utils/className'
import { TechMaterialsCallout } from '../TechMaterialsCallout'
import { TechMaterialsProductLine } from '../TechMaterialsProductLine'

type HeadingPermalinkSize = 'comfortable' | 'compact'

function headingPermalinkSizeClassName(size: HeadingPermalinkSize) {
  switch (size) {
    case 'comfortable':
      return '[&_a]:min-h-11 [&_a]:min-w-11'
    case 'compact':
      return '[&_a]:min-h-6 [&_a]:min-w-6'
    default: {
      const exhaustive: never = size
      throw new Error(`Ukjent hopplenke-størrelse: ${exhaustive}`)
    }
  }
}

function headingPermalinkClassName(
  size: HeadingPermalinkSize,
  className?: string
) {
  return cn(
    'scroll-mt-24 [&_a]:ms-2 [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:align-middle [&_a]:text-foreground/55 [&_a]:no-underline [&_a]:opacity-80 hover:[&_a]:text-primary hover:[&_a]:opacity-100 [&_a]:focus-visible:rounded-sm [&_a]:focus-visible:text-primary [&_a]:focus-visible:opacity-100 [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-foreground [&_a]:focus-visible:ring-offset-2 [&_a]:focus-visible:ring-offset-background [&_a]:focus-visible:outline-none',
    headingPermalinkSizeClassName(size),
    className
  )
}

function TechMaterialsH2({
  className,
  children,
  id,
  ...props
}: ComponentProps<'h2'>) {
  const isTocHeading = id === 'innhold'

  return (
    <h2
      id={id}
      className={headingPermalinkClassName(
        'comfortable',
        isTocHeading ?
          cn(
            'font-utekos-text-medium text-sm tracking-[0.14em] text-foreground/80 uppercase',
            className
          )
        : cn(
            'mt-12 font-utekos-text-medium text-3xl tracking-tight text-foreground first:mt-0 md:text-4xl',
            className
          )
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

function TechMaterialsH3({
  className,
  children,
  id,
  ...props
}: ComponentProps<'h3'>) {
  return (
    <h3
      id={id}
      className={headingPermalinkClassName(
        'comfortable',
        cn(
          'mt-8 font-utekos-text-medium text-2xl leading-tight tracking-tight text-foreground',
          className
        )
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

function TechMaterialsH4({
  className,
  children,
  id,
  ...props
}: ComponentProps<'h4'>) {
  return (
    <h4
      id={id}
      className={headingPermalinkClassName(
        'compact',
        cn(
          'mt-8 font-utekos-text-medium text-xl leading-tight tracking-tight text-foreground',
          className
        )
      )}
      {...props}
    >
      {children}
    </h4>
  )
}

function TechMaterialsParagraph({
  className,
  children,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'mt-0 max-w-[65ch] font-utekos-text text-base leading-relaxed text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

function TechMaterialsTable({
  className,
  children,
  ...props
}: ComponentProps<'table'>) {
  return (
    <div className='my-6 overflow-x-auto rounded-xl border border-foreground/12 bg-background/40'>
      <table
        className={cn(
          'w-full min-w-xl border-collapse text-left font-utekos-text text-sm text-foreground',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

function TechMaterialsTableHead({
  className,
  children,
  ...props
}: ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('border-b border-foreground/12 bg-jungle', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

function TechMaterialsTableHeaderCell({
  className,
  children,
  ...props
}: ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'px-4 py-3 font-utekos-text-medium text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

function TechMaterialsTableCell({
  className,
  children,
  ...props
}: ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'border-t border-foreground/10 px-4 py-3 align-top text-foreground/90',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

function TechMaterialsBlockquote({
  className,
  children,
  ...props
}: ComponentProps<'blockquote'>) {
  return (
    <blockquote
      className={cn(
        'my-8 bg-jungle px-5 py-4 font-utekos-text text-lg leading-relaxed text-foreground [&_p]:mt-0 [&_p]:max-w-none',
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  )
}

function TechMaterialsUnorderedList({
  className,
  children,
  ...props
}: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'my-5 list-disc space-y-2 pl-5 font-utekos-text marker:text-primary',
        className
      )}
      {...props}
    >
      {children}
    </ul>
  )
}

function TechMaterialsListItem({
  className,
  children,
  ...props
}: ComponentProps<'li'>) {
  return (
    <li
      className={cn('max-w-[65ch] leading-relaxed text-foreground', className)}
      {...props}
    >
      {children}
    </li>
  )
}

function TechMaterialsAnchor({
  className,
  href,
  children,
  ...props
}: ComponentProps<'a'>) {
  return (
    <a
      href={href}
      className={cn(
        'text-foreground underline decoration-primary/70 underline-offset-4 hover:text-primary focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}

function TechMaterialsFigcaption({
  className,
  children,
  ...props
}: ComponentProps<'figcaption'>) {
  return (
    <figcaption
      className={cn(
        'mb-3 font-utekos-text-medium text-sm tracking-wide text-foreground/75',
        className
      )}
      {...props}
    >
      {children}
    </figcaption>
  )
}

function TechMaterialsFigure({
  className,
  children,
  ...props
}: ComponentProps<'figure'>) {
  return (
    <figure className={cn('my-8', className)} {...props}>
      {children}
    </figure>
  )
}

function TechMaterialsHorizontalRule({
  className,
  ...props
}: ComponentProps<'hr'>) {
  return (
    <hr
      className={cn('my-12 border-foreground/12', className)}
      {...props}
    />
  )
}

export const techMaterialsMdxComponents = {
  h2: TechMaterialsH2,
  h3: TechMaterialsH3,
  h4: TechMaterialsH4,
  p: TechMaterialsParagraph,
  table: TechMaterialsTable,
  thead: TechMaterialsTableHead,
  th: TechMaterialsTableHeaderCell,
  td: TechMaterialsTableCell,
  blockquote: TechMaterialsBlockquote,
  ul: TechMaterialsUnorderedList,
  li: TechMaterialsListItem,
  a: TechMaterialsAnchor,
  figure: TechMaterialsFigure,
  figcaption: TechMaterialsFigcaption,
  hr: TechMaterialsHorizontalRule,
  TechMaterialsCallout,
  TechMaterialsProductLine
} satisfies MDXComponents
