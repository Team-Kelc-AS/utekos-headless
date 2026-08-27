import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'
import { MdxAction } from '@/components/mdx/MdxAction'
import { MdxBlockquote } from '@/components/mdx/MdxBlockquote'
import { MdxCallout } from '@/components/mdx/MdxCallout'
import { MdxColumns } from '@/components/mdx/MdxColumns'
import { MdxFigure } from '@/components/mdx/MdxFigure'
import { MdxHeading } from '@/components/mdx/MdxHeading'
import { MdxLink } from '@/components/mdx/MdxLink'
import { MdxList } from '@/components/mdx/MdxList'
import { MdxParagraph } from '@/components/mdx/MdxParagraph'
import { MdxTable } from '@/components/mdx/MdxTable'
import { cn } from '@/lib/utils'

const components = {
  h1: props => <MdxHeading level={1} {...props} />,
  h2: props => <MdxHeading level={2} {...props} />,
  h3: props => <MdxHeading level={3} {...props} />,
  h4: props => <MdxHeading level={4} {...props} />,
  p: MdxParagraph,
  a: MdxLink,
  ul: props => <MdxList {...props} />,
  ol: props => <MdxList ordered {...props} />,
  blockquote: MdxBlockquote,
  table: MdxTable,
  thead: ({ className, ...props }) => (
    <thead
      className={cn('bg-foreground/6', className)}
      {...props}
    />
  ),
  tbody: ({ className, ...props }) => (
    <tbody
      className={cn('divide-y divide-foreground/8', className)}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn('align-top', className)} {...props} />
  ),
  th: ({ className, scope, ...props }) => (
    <th
      className={cn(
        'px-4 py-3 font-utekos-text-medium text-foreground',
        className
      )}
      scope={scope ?? 'col'}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn('px-4 py-3', className)} {...props} />
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn(
        'my-10 border-0 border-t border-foreground/12',
        className
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        'rounded-md bg-foreground/8 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground',
        className
      )}
      {...props}
    />
  ),
  img: props => {
    const imageProps = props as ImageProps
    return (
      <Image
        sizes='100vw'
        className='aspect-square h-auto w-full object-cover'
        {...imageProps}
        alt={imageProps.alt ?? ''}
      />
    )
  },
  MdxAction,
  MdxCallout,
  MdxColumns,
  MdxFigure
} satisfies MDXComponents

export function useMDXComponents(): MDXComponents {
  return components
}
