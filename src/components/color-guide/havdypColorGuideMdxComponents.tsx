import type { ComponentProps } from 'react'
import type { MDXComponents } from 'mdx/types'
import { HavdypColorGuideSwatch } from '@/components/color-guide/HavdypColorGuideSwatch'
import { cn } from '@/lib/utils/className'

function ColorGuideH1({
  className,
  children,
  ...props
}: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn(
        'col-start-1 row-start-1 self-center font-utekos-text-medium text-2xl leading-tight tracking-tight text-foreground sm:text-3xl',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

function ColorGuideParagraph({
  className,
  children,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'col-span-2 mt-4 max-w-[65ch] font-sans text-sm leading-relaxed text-foreground/90 sm:text-base',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

function ColorGuideUnorderedList({
  className,
  children,
  ...props
}: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'col-span-2 mt-5 grid gap-2 sm:grid-cols-2',
        className
      )}
      {...props}
    >
      {children}
    </ul>
  )
}

function ColorGuideListItem({
  className,
  children,
  ...props
}: ComponentProps<'li'>) {
  return (
    <li
      className={cn(
        'rounded-xl bg-night px-3.5 py-3 font-sans text-sm leading-snug text-foreground/90 sm:text-base',
        className
      )}
      {...props}
    >
      {children}
    </li>
  )
}

function ColorGuideStrong({
  className,
  children,
  ...props
}: ComponentProps<'strong'>) {
  return (
    <strong
      className={cn(
        'block font-utekos-text-medium text-primary',
        className
      )}
      {...props}
    >
      {children}
    </strong>
  )
}

function ColorGuideAnchor({
  className,
  href,
  children,
  ...props
}: ComponentProps<'a'>) {
  const isExternal = href?.startsWith('http')

  return (
    <a
      href={href}
      className={cn(
        'col-span-2 mt-3 mr-5 inline-flex min-h-11 items-center font-utekos-text-medium text-sm text-foreground underline decoration-foreground/70 underline-offset-4 hover:text-foreground/80 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none sm:text-base',
        className
      )}
      {...(isExternal ?
        {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      : {})}
      {...props}
    >
      {children}
      {isExternal ?
        <span className='sr-only'> (åpnes i ny fane)</span>
      : null}
    </a>
  )
}

export const havdypColorGuideMdxComponents = {
  h1: ColorGuideH1,
  p: ColorGuideParagraph,
  ul: ColorGuideUnorderedList,
  li: ColorGuideListItem,
  strong: ColorGuideStrong,
  a: ColorGuideAnchor,
  HavdypColorGuideSwatch
} satisfies MDXComponents
