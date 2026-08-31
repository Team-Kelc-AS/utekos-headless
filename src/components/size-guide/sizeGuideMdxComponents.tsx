import type { ComponentProps } from 'react'
import type { MDXComponents } from 'mdx/types'
import { cn } from '@/lib/utils/className'
import { SizeGuideCallout } from './SizeGuideCallout'

function SizeGuideH1({
  className,
  children,
  ...props
}: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn(
        'font-sans text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

function SizeGuideH2({
  className,
  children,
  ...props
}: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'mt-8 font-sans text-xl leading-tight font-semibold tracking-tight text-foreground first:mt-0 sm:text-2xl',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

function SizeGuideH3({
  className,
  children,
  ...props
}: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        'mt-5 font-sans text-base leading-snug font-semibold tracking-tight text-foreground sm:text-lg',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

function SizeGuideParagraph({
  className,
  children,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'mt-3 max-w-[65ch] font-sans text-sm leading-relaxed text-foreground/90 sm:text-base',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

function SizeGuideUnorderedList({
  className,
  children,
  ...props
}: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'my-3 list-disc space-y-2 pl-5 font-sans text-sm leading-relaxed text-foreground/90 marker:text-primary sm:text-base',
        className
      )}
      {...props}
    >
      {children}
    </ul>
  )
}

function SizeGuideListItem({
  className,
  children,
  ...props
}: ComponentProps<'li'>) {
  return (
    <li
      className={cn('max-w-[65ch] text-foreground/90', className)}
      {...props}
    >
      {children}
    </li>
  )
}

function SizeGuideTable({
  className,
  children,
  ...props
}: ComponentProps<'table'>) {
  return (
    <div className='my-5 rounded-xl border border-foreground/12 bg-background'>
      <table
        className={cn(
          'w-full table-fixed border-collapse text-left font-sans text-foreground',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

function SizeGuideTableHead({
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

function SizeGuideTableHeaderCell({
  className,
  children,
  ...props
}: ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'px-2 py-2.5 text-right text-xs font-semibold whitespace-nowrap text-foreground sm:px-3 sm:py-3 sm:text-sm',
        'first:w-[46%] first:px-3 first:text-left first:whitespace-normal first:sm:px-4',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

function SizeGuideTableCell({
  className,
  children,
  ...props
}: ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'border-t border-foreground/10 px-2 py-2.5 text-right align-top text-xs whitespace-nowrap text-foreground/90 tabular-nums sm:px-3 sm:py-3 sm:text-sm',
        'first:px-3 first:text-left first:whitespace-normal first:text-foreground first:sm:px-4',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

function SizeGuideHorizontalRule({
  className,
  ...props
}: ComponentProps<'hr'>) {
  return (
    <hr
      className={cn('my-8 border-foreground/12', className)}
      {...props}
    />
  )
}

function SizeGuideStrong({
  className,
  children,
  ...props
}: ComponentProps<'strong'>) {
  return (
    <strong
      className={cn('font-semibold text-foreground', className)}
      {...props}
    >
      {children}
    </strong>
  )
}

export const sizeGuideMdxComponents = {
  h1: SizeGuideH1,
  h2: SizeGuideH2,
  h3: SizeGuideH3,
  p: SizeGuideParagraph,
  ul: SizeGuideUnorderedList,
  li: SizeGuideListItem,
  table: SizeGuideTable,
  thead: SizeGuideTableHead,
  th: SizeGuideTableHeaderCell,
  td: SizeGuideTableCell,
  hr: SizeGuideHorizontalRule,
  strong: SizeGuideStrong,
  SizeGuideCallout
} satisfies MDXComponents
