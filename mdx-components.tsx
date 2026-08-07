import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'
import { H1 } from '@/components/typography/TypographyH1'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { H4 } from '@/components/typography/TypographyH4'
import { P } from '@/components/typography/TypographyP'

// This file allows us to provide custom React components
// to be used in MDX files. We can import and use any
// React component  want, including inline styles,
// components from other libraries, and more.

const components = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
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
  }
} satisfies MDXComponents

export function useMDXComponents(): MDXComponents {
  return components
}
