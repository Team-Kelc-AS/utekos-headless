import { cn } from '@/lib/utils/className'
import { ArrowRight, Check, Shield } from 'lucide-react'
import type { MDXComponents } from 'mdx/types'
import type { Route } from 'next'
import Link from 'next/link'
import type { ComponentProps } from 'react'

export const comfyrobeMdxComponents = {
  blockquote: ({
    className,
    children,
    ...props
  }: ComponentProps<'blockquote'>) => (
    <blockquote
      className={cn(
        'mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/6 px-4 py-2 text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_10%,transparent)] [&_p]:m-0 [&_p]:font-utekos-text-medium [&_p]:text-sm [&_p]:leading-none [&_p]:text-foreground',
        className
      )}
      {...props}
    >
      <Shield aria-hidden='true' className='size-4 shrink-0' />
      {children}
    </blockquote>
  ),
  h2: ({
    className,
    children,
    ...props
  }: ComponentProps<'h2'>) => (
    <h2
      className={cn(
        'max-w-xl font-utekos-text-medium text-3xl leading-[1.02] tracking-[-0.035em] text-balance text-foreground sm:text-4xl lg:text-[2.75rem]',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  p: ({
    className,
    children,
    ...props
  }: ComponentProps<'p'>) => (
    <p
      className={cn(
        'mt-5 max-w-2xl font-utekos-text text-base leading-relaxed tracking-normal text-foreground/82 sm:text-lg',
        className
      )}
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({
    className,
    children,
    ...props
  }: ComponentProps<'ul'>) => (
    <ul
      className={cn(
        'mt-7 divide-y divide-foreground/12 border-y border-foreground/12',
        className
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  li: ({
    className,
    children,
    ...props
  }: ComponentProps<'li'>) => (
    <li
      className={cn(
        'flex items-start gap-3 py-3.5 text-sm leading-snug text-foreground/78 sm:text-base',
        className
      )}
      {...props}
    >
      <span className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
        <Check aria-hidden='true' className='size-3.5' />
      </span>
      <span>{children}</span>
    </li>
  ),
  strong: ({
    className,
    children,
    ...props
  }: ComponentProps<'strong'>) => (
    <strong
      className={cn(
        'font-utekos-text-medium text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </strong>
  ),
  a: ({
    className,
    href,
    children,
    ...props
  }: ComponentProps<'a'>) => {
    if (href?.startsWith('#')) {
      return (
        <a
          href={href}
          className={cn('sr-only', className)}
          {...props}
        >
          {children}
        </a>
      )
    }

    return (
      <Link
        href={(href ?? '/comfyrobe') as Route}
        className={cn(
          'group hover:bg-primary-hover mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-none bg-primary px-7 py-3 font-utekos-text-medium text-primary-foreground no-underline shadow-[0_18px_40px_-26px_color-mix(in_oklch,var(--primary)_80%,transparent)] transition-[background-color,transform] hover:scale-[1.02] hover:no-underline focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-jungle',
          className
        )}
      >
        {children}
        <ArrowRight
          aria-hidden='true'
          className='size-4 transition-transform group-hover:translate-x-1'
        />
      </Link>
    )
  }
} satisfies MDXComponents
